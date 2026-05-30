import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { platformSettings } from "@/lib/db/schema";

export const GLOBAL_WITHDRAWAL_SETTINGS_ID = "global";
export const DEFAULT_TRAINING_ALLOWED_WEEKDAYS = [1, 2, 3, 4, 5];

export function normalizeTrainingAllowedWeekdays(value: unknown): number[] {
  if (!Array.isArray(value)) return DEFAULT_TRAINING_ALLOWED_WEEKDAYS;

  return [...new Set(value.map(Number))]
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    .sort((a, b) => a - b);
}

export async function getGlobalWithdrawalSettings() {
  const settings = await db.query.platformSettings.findFirst({
    where: eq(platformSettings.id, GLOBAL_WITHDRAWAL_SETTINGS_ID),
  });

  return {
    withdrawalFeePercent: settings?.withdrawalFeePercent ?? "0",
    minimumWithdrawalAmount: settings?.minimumWithdrawalAmount ?? "0",
    wrongAnswerRewardPercent: settings?.wrongAnswerRewardPercent ?? "50",
    trainingAllowedWeekdays: normalizeTrainingAllowedWeekdays(
      settings?.trainingAllowedWeekdays,
    ),
  };
}
