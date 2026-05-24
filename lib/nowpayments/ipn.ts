import { createHmac } from "crypto";

export function verifyNowpaymentsSignature(
  body: Record<string, unknown>,
  signature: string | null,
): boolean {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret || !signature) return false;

  const sorted = JSON.stringify(body, Object.keys(body).sort());
  const expected = createHmac("sha512", secret).update(sorted).digest("hex");
  return expected === signature;
}

export function parseUserIdFromOrderId(orderId: string | undefined): string | null {
  if (!orderId?.startsWith("dep_")) return null;
  const parts = orderId.split("_");
  if (parts.length < 3) return null;
  return parts[1];
}

export const CREDITED_STATUSES = new Set([
  "finished",
  "confirmed",
  "sending",
]);
