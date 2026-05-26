import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  ledgerEntries,
  ledgerTypeEnum,
  wallets,
} from "@/lib/db/schema";
import { parseAmount } from "@/lib/utils";

type LedgerType = (typeof ledgerTypeEnum.enumValues)[number];

export async function getWalletBalance(userId: string): Promise<string> {
  const wallet = await db.query.wallets.findFirst({
    where: eq(wallets.userId, userId),
  });
  return wallet?.balanceUsdt ?? "0";
}

export async function getRecentWalletLedgerEntries(userId: string, limit = 10) {
  return db.query.ledgerEntries.findMany({
    where: and(
      eq(ledgerEntries.userId, userId),
      inArray(ledgerEntries.type, ["task_reward", "free_training_bonus"]),
    ),
    orderBy: [desc(ledgerEntries.createdAt)],
    limit,
  });
}

export async function ensureWallet(userId: string) {
  const existing = await db.query.wallets.findFirst({
    where: eq(wallets.userId, userId),
  });
  if (existing) return existing;
  const [wallet] = await db
    .insert(wallets)
    .values({ userId, balanceUsdt: "0" })
    .returning();
  return wallet;
}

export async function applyLedgerEntry(params: {
  userId: string;
  type: LedgerType;
  amount: string | number;
  metadata?: Record<string, unknown>;
}) {
  const amount = parseAmount(params.amount);
  const amountNum = parseFloat(amount);
  if (amountNum === 0) {
    throw new Error("Amount cannot be zero");
  }

  await ensureWallet(params.userId);

  if (amountNum < 0) {
    const current = parseFloat(await getWalletBalance(params.userId));
    if (current + amountNum < 0) {
      throw new Error("Insufficient balance");
    }
  }

  const [entry] = await db
    .insert(ledgerEntries)
    .values({
      userId: params.userId,
      type: params.type,
      amount,
      metadata: params.metadata ?? null,
    })
    .returning();

  const [wallet] = await db
    .update(wallets)
    .set({
      balanceUsdt: sql`${wallets.balanceUsdt} + ${amount}`,
      updatedAt: new Date(),
    })
    .where(eq(wallets.userId, params.userId))
    .returning();

  return { entry, balance: wallet.balanceUsdt };
}
