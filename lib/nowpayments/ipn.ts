import { createHmac, timingSafeEqual } from "crypto";

function hmac(value: string, secret: string) {
  return createHmac("sha512", secret).update(value).digest("hex");
}

function safeEqualHex(a: string, b: string) {
  const left = Buffer.from(a.trim().toLowerCase(), "hex");
  const right = Buffer.from(b.trim().toLowerCase(), "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortValue);
  if (!value || typeof value !== "object") return value;

  return Object.keys(value as Record<string, unknown>)
    .sort()
    .reduce<Record<string, unknown>>((sorted, key) => {
      sorted[key] = sortValue((value as Record<string, unknown>)[key]);
      return sorted;
    }, {});
}

export function verifyNowpaymentsSignature(
  body: Record<string, unknown>,
  signature: string | null,
  rawBody?: string,
): boolean {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret || !signature) return false;

  const candidates = [
    JSON.stringify(body, Object.keys(body).sort()),
    JSON.stringify(sortValue(body)),
    rawBody,
    rawBody?.trim(),
  ].filter((value): value is string => !!value);

  return candidates.some((candidate) =>
    safeEqualHex(hmac(candidate, secret), signature),
  );
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
