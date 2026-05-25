import { APP_NAME } from "@/lib/constants";

const API_BASE =
  process.env.NOWPAYMENTS_SANDBOX === "true"
    ? "https://api-sandbox.nowpayments.io/v1"
    : "https://api.nowpayments.io/v1";

export type NowPayment = {
  payment_id: string | number;
  payment_status: string;
  pay_address: string;
  pay_amount?: number;
  pay_currency: string;
  price_amount: number;
  price_currency: string;
  actually_paid?: number;
  order_id?: string;
};

function apiKey() {
  const key = process.env.NOWPAYMENTS_API_KEY;
  if (!key) throw new Error("NOWPAYMENTS_API_KEY is not configured");
  return key;
}

export function getPayCurrency() {
  return process.env.NOWPAYMENTS_PAY_CURRENCY ?? "usdtmatic";
}

export async function createUsdtDepositPayment(params: {
  userId: string;
  depositId: string;
  amountUsdt: number;
}): Promise<NowPayment> {
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000");

  const ipnUrl =
    process.env.NOWPAYMENTS_IPN_CALLBACK_URL ??
    `${baseUrl}/api/webhooks/nowpayments`;

  const res = await fetch(`${API_BASE}/payment`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      price_amount: params.amountUsdt,
      price_currency: "usd",
      pay_currency: getPayCurrency(),
      order_id: `dep_${params.userId}_${params.depositId}`,
      order_description: `${APP_NAME} wallet deposit`,
      ipn_callback_url: ipnUrl,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`NOWPayments error: ${err}`);
  }

  return res.json() as Promise<NowPayment>;
}

export async function getPaymentStatus(
  paymentId: string,
): Promise<NowPayment> {
  const res = await fetch(`${API_BASE}/payment/${paymentId}`, {
    headers: { "x-api-key": apiKey() },
  });
  if (!res.ok) {
    throw new Error("Failed to fetch payment status");
  }
  return res.json() as Promise<NowPayment>;
}
