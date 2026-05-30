import { getAppWeekday } from "@/lib/utils";
import { getGlobalWithdrawalSettings } from "@/lib/withdrawals/settings";

export const TRAINING_CLOSED_MESSAGE =
  "Training is closed today. Please come back on the next available training day.";

export async function getTrainingScheduleState() {
  const settings = await getGlobalWithdrawalSettings();
  const today = getAppWeekday();
  const allowed = settings.trainingAllowedWeekdays.includes(today);

  return {
    allowed,
    today,
    allowedWeekdays: settings.trainingAllowedWeekdays,
    reason: allowed ? undefined : TRAINING_CLOSED_MESSAGE,
  };
}
