export const APP_NAME = "ModelMind";

/** Set NEXT_PUBLIC_TELEGRAM_SUPPORT_URL in Vercel when the admin support link is ready. */
export const TELEGRAM_SUPPORT_URL =
  process.env.NEXT_PUBLIC_TELEGRAM_SUPPORT_URL ?? "https://t.me/modelmind_support";

/** Wait time between paid answers for tiers that allow more than one per day. */
export const PAID_TASK_COOLDOWN_HOURS = 1;

export const FREE_TRAINING_BONUS_USDT = "1.00000000";
export const FREE_TRAINING_TOTAL_QUESTIONS = 3;
