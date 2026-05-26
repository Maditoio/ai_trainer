"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { withdrawalRequests } from "@/lib/db/schema";
import { parseAmount } from "@/lib/utils";
import { getGlobalWithdrawalSettings } from "@/lib/withdrawals/settings";
import { applyLedgerEntry, getWalletBalance } from "@/lib/wallet/ledger";

const POLYGON_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export async function createWithdrawalRequest(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const amount = parseAmount(String(formData.get("amount") ?? ""));
  const polygonAddress = String(formData.get("polygonAddress") ?? "").trim();
  const settings = await getGlobalWithdrawalSettings();

  if (!POLYGON_ADDRESS_RE.test(polygonAddress)) {
    throw new Error("Enter a valid Polygon wallet address (0x…)");
  }

  const amountNum = parseFloat(amount);
  const minimumWithdrawal = parseFloat(settings.minimumWithdrawalAmount);
  const balance = parseFloat(await getWalletBalance(session.user.id));
  if (balance < minimumWithdrawal) {
    throw new Error(`Your balance must be at least ${settings.minimumWithdrawalAmount} USDT to withdraw`);
  }
  if (amountNum < minimumWithdrawal) {
    throw new Error(`Minimum withdrawal is ${settings.minimumWithdrawalAmount} USDT`);
  }

  if (amountNum > balance) {
    throw new Error("Insufficient balance");
  }
  if (amountNum <= 0) {
    throw new Error("Amount must be positive");
  }

  const feePercent = Number(settings.withdrawalFeePercent);
  const feeAmount = parseAmount((amountNum * feePercent) / 100);
  const netAmount = parseAmount(amountNum - parseFloat(feeAmount));

  await db.insert(withdrawalRequests).values({
    userId: session.user.id,
    amount,
    feePercent: feePercent.toFixed(4),
    feeAmount,
    netAmount,
    polygonAddress,
  });

  revalidatePath("/wallet");
  revalidatePath("/wallet/withdraw");
}

export async function getWithdrawalHistory() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return db.query.withdrawalRequests.findMany({
    where: eq(withdrawalRequests.userId, session.user.id),
    orderBy: [desc(withdrawalRequests.createdAt)],
    limit: 50,
  });
}

export async function reviewWithdrawal(
  requestId: string,
  action: "approve" | "reject",
  adminNote?: string,
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const request = await db.query.withdrawalRequests.findFirst({
    where: eq(withdrawalRequests.id, requestId),
  });
  if (!request || request.status !== "pending") {
    throw new Error("Request not found");
  }

  if (action === "approve") {
    await applyLedgerEntry({
      userId: request.userId,
      type: "withdrawal",
      amount: (-parseFloat(request.amount)).toFixed(8),
      metadata: { withdrawalRequestId: requestId, polygonAddress: request.polygonAddress },
    });
  }

  await db
    .update(withdrawalRequests)
    .set({
      status: action === "approve" ? "completed" : "rejected",
      adminNote: adminNote ?? null,
      reviewedAt: new Date(),
    })
    .where(eq(withdrawalRequests.id, requestId));

  revalidatePath("/admin/withdrawals");
  revalidatePath("/wallet");
}
