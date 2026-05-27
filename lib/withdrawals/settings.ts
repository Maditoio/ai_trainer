import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { platformSettings } from "@/lib/db/schema";

export const GLOBAL_WITHDRAWAL_SETTINGS_ID = "global";

export async function getGlobalWithdrawalSettings() {
  const settings = await db.query.platformSettings.findFirst({
    where: eq(platformSettings.id, GLOBAL_WITHDRAWAL_SETTINGS_ID),
  });

  return {
    withdrawalFeePercent: settings?.withdrawalFeePercent ?? "0",
    minimumWithdrawalAmount: settings?.minimumWithdrawalAmount ?? "0",
    wrongAnswerRewardPercent: settings?.wrongAnswerRewardPercent ?? "50",
  };
}
