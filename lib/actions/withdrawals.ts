"use server";

import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, withdrawalRequests } from "@/lib/db/schema";
import { formatUsdt, parseAmount } from "@/lib/utils";
import { getGlobalWithdrawalSettings } from "@/lib/withdrawals/settings";
import { applyLedgerEntry, getWalletBalance } from "@/lib/wallet/ledger";

const POLYGON_ADDRESS_RE = /^0x[a-fA-F0-9]{40}$/;

export async function createWithdrawalRequest(
  formData: FormData,
): Promise<{ success?: true; error?: string }> {
  const session = await auth();
  if (!session?.user?.id) return { error: "Please sign in again to continue." };

  let amount: string;
  try {
    amount = parseAmount(String(formData.get("amount") ?? ""));
  } catch {
    return { error: "Enter a valid withdrawal amount." };
  }
  const polygonAddress = String(formData.get("polygonAddress") ?? "").trim();
  const settings = await getGlobalWithdrawalSettings();
  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  });
  const savedPolygonAddress = user?.withdrawalPolygonAddress?.trim() ?? "";
  const payoutAddress = savedPolygonAddress || polygonAddress;

  const pendingWithdrawal = await db.query.withdrawalRequests.findFirst({
    where: and(
      eq(withdrawalRequests.userId, session.user.id),
      eq(withdrawalRequests.status, "pending"),
    ),
  });
  if (pendingWithdrawal) {
    return {
      error:
        "You already have a pending withdrawal request. Please wait for it to be reviewed before submitting another one.",
    };
  }

  if (!POLYGON_ADDRESS_RE.test(payoutAddress)) {
    return { error: "Enter a valid Polygon wallet address starting with 0x." };
  }

  const amountNum = parseFloat(amount);
  const minimumWithdrawal = parseFloat(settings.minimumWithdrawalAmount);
  const balance = parseFloat(await getWalletBalance(session.user.id));
  if (balance < minimumWithdrawal) {
    return {
      error: `Your balance must be at least ${formatUsdt(settings.minimumWithdrawalAmount)} USDT to withdraw.`,
    };
  }
  if (amountNum < minimumWithdrawal) {
    return { error: `Minimum withdrawal is ${formatUsdt(settings.minimumWithdrawalAmount)} USDT.` };
  }

  if (amountNum > balance) {
    return { error: "Insufficient balance." };
  }
  if (amountNum <= 0) {
    return { error: "Amount must be positive." };
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
    polygonAddress: payoutAddress,
  });

  if (!savedPolygonAddress) {
    await db
      .update(users)
      .set({ withdrawalPolygonAddress: payoutAddress })
      .where(eq(users.id, session.user.id));
  }

  revalidatePath("/wallet");
  revalidatePath("/wallet/withdraw");
  revalidatePath("/admin/withdrawal-requests");

  return { success: true };
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
  revalidatePath("/admin/withdrawal-requests");
  revalidatePath("/wallet");
}
