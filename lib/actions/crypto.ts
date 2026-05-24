"use server";

import { randomUUID } from "crypto";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { cryptoDeposits } from "@/lib/db/schema";
import { createUsdtDepositPayment } from "@/lib/nowpayments/client";
import { parseAmount } from "@/lib/utils";

export async function createCryptoDeposit(amountUsdt: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = parseAmount(amountUsdt);
  const amount = parseFloat(parsed);
  if (amount <= 0) throw new Error("Enter a valid amount");

  const depositId = randomUUID();
  const payment = await createUsdtDepositPayment({
    userId: session.user.id,
    depositId,
    amountUsdt: amount,
  });

  await db.insert(cryptoDeposits).values({
    id: depositId,
    userId: session.user.id,
    nowpaymentsPaymentId: String(payment.payment_id),
    payAddress: payment.pay_address,
    payCurrency: payment.pay_currency,
    priceAmount: parsed,
    paymentStatus: payment.payment_status ?? "waiting",
  });

  revalidatePath("/wallet");
  revalidatePath("/wallet/deposits");

  return {
    depositId,
    payAddress: payment.pay_address,
    payAmount: payment.pay_amount,
    payCurrency: payment.pay_currency,
    paymentId: String(payment.payment_id),
    priceAmount: parsed,
  };
}

export async function getCryptoDepositHistory() {
  const session = await auth();
  if (!session?.user?.id) return [];

  return db.query.cryptoDeposits.findMany({
    where: eq(cryptoDeposits.userId, session.user.id),
    orderBy: [desc(cryptoDeposits.createdAt)],
    limit: 50,
  });
}

export async function getActiveCryptoDeposit() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const deposits = await db.query.cryptoDeposits.findMany({
    where: eq(cryptoDeposits.userId, session.user.id),
    orderBy: [desc(cryptoDeposits.createdAt)],
    limit: 5,
  });

  return (
    deposits.find(
      (d) =>
        !d.creditedAt &&
        !["failed", "expired", "refunded", "creating"].includes(d.paymentStatus),
    ) ?? null
  );
}
