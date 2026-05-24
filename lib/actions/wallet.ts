"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { depositRequests, ledgerEntries } from "@/lib/db/schema";
import { parseAmount } from "@/lib/utils";
import { applyLedgerEntry, getWalletBalance } from "@/lib/wallet/ledger";

export async function createDepositRequest(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const amount = String(formData.get("amount") ?? "");
  const referenceNote = String(formData.get("referenceNote") ?? "") || null;

  try {
    const parsed = parseAmount(amount);
    if (parseFloat(parsed) <= 0) {
      throw new Error("Amount must be positive");
    }

    await db.insert(depositRequests).values({
      userId: session.user.id,
      amount: parsed,
      referenceNote,
    });

    revalidatePath("/wallet");
  } catch (e) {
    if (e instanceof Error) throw e;
    throw new Error("Invalid amount");
  }
}

export async function getWalletData() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;
  const balance = await getWalletBalance(userId);
  const ledger = await db.query.ledgerEntries.findMany({
    where: eq(ledgerEntries.userId, userId),
    orderBy: [desc(ledgerEntries.createdAt)],
    limit: 50,
  });
  const deposits = await db.query.depositRequests.findMany({
    where: eq(depositRequests.userId, userId),
    orderBy: [desc(depositRequests.createdAt)],
    limit: 20,
  });

  return { balance, ledger, deposits };
}

export async function reviewDepositRequest(
  requestId: string,
  action: "approve" | "reject",
  adminNote?: string,
) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return { error: "Unauthorized" };
  }

  const request = await db.query.depositRequests.findFirst({
    where: eq(depositRequests.id, requestId),
  });
  if (!request || request.status !== "pending") {
    return { error: "Request not found or already reviewed" };
  }

  if (action === "approve") {
    await applyLedgerEntry({
      userId: request.userId,
      type: "deposit",
      amount: request.amount,
      metadata: { depositRequestId: requestId },
    });
  }

  await db
    .update(depositRequests)
    .set({
      status: action === "approve" ? "approved" : "rejected",
      adminNote: adminNote ?? null,
      reviewedAt: new Date(),
    })
    .where(eq(depositRequests.id, requestId));

  revalidatePath("/admin/deposits");
  revalidatePath("/wallet");
  return { success: true };
}
