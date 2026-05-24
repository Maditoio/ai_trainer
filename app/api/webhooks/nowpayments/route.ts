import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cryptoDeposits } from "@/lib/db/schema";
import {
  CREDITED_STATUSES,
  parseUserIdFromOrderId,
  verifyNowpaymentsSignature,
} from "@/lib/nowpayments/ipn";
import { applyLedgerEntry } from "@/lib/wallet/ledger";
import { parseAmount } from "@/lib/utils";

export async function POST(req: Request) {
  const signature = req.headers.get("x-nowpayments-sig");
  const body = (await req.json()) as Record<string, unknown>;

  if (!verifyNowpaymentsSignature(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const paymentId = String(body.payment_id ?? "");
  const status = String(body.payment_status ?? "");
  const orderId = String(body.order_id ?? "");
  const actuallyPaid = body.actually_paid ?? body.pay_amount;

  if (!paymentId) {
    return NextResponse.json({ ok: true });
  }

  const deposit = await db.query.cryptoDeposits.findFirst({
    where: eq(cryptoDeposits.nowpaymentsPaymentId, paymentId),
  });

  const userId = deposit?.userId ?? parseUserIdFromOrderId(orderId);

  if (deposit) {
    await db
      .update(cryptoDeposits)
      .set({
        paymentStatus: status,
        actuallyPaid:
          actuallyPaid != null
            ? parseAmount(String(actuallyPaid))
            : null,
      })
      .where(eq(cryptoDeposits.id, deposit.id));
  }

  if (
    userId &&
    CREDITED_STATUSES.has(status) &&
    deposit &&
    !deposit.creditedAt &&
    actuallyPaid != null &&
    parseFloat(String(actuallyPaid)) > 0
  ) {
    const creditAmount = parseAmount(String(actuallyPaid));

    await applyLedgerEntry({
      userId,
      type: "crypto_deposit",
      amount: creditAmount,
      metadata: {
        paymentId,
        payAddress: deposit.payAddress,
        orderId,
      },
    });

    await db
      .update(cryptoDeposits)
      .set({ creditedAt: new Date(), paymentStatus: status })
      .where(eq(cryptoDeposits.id, deposit.id));
  }

  return NextResponse.json({ ok: true });
}
