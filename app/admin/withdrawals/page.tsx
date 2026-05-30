import Link from "next/link";
import { updateGlobalWithdrawalSettings } from "@/lib/actions/admin";
import { getGlobalWithdrawalSettings } from "@/lib/withdrawals/settings";
import { formatUsdt } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const trainingDays = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

export default async function AdminWithdrawalsPage() {
  const settings = await getGlobalWithdrawalSettings();
  const allowedTrainingDays = new Set(settings.trainingAllowedWeekdays);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Withdrawal settings</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Set platform payout rules for all users.
          </p>
        </div>
        <Link href="/admin/withdrawal-requests">
          <Button variant="outline">View requests</Button>
        </Link>
      </div>

      <Card>
        <CardTitle>Global withdrawal settings</CardTitle>
        <CardDescription className="mt-2">
          These limits apply to every user withdrawal request.
        </CardDescription>
        <form action={updateGlobalWithdrawalSettings} className="mt-4 grid gap-3">
          <label className="text-xs font-semibold text-slate-600">
            Withdrawal fee %
            <Input
              name="withdrawalFeePercent"
              type="number"
              min="0"
              max="100"
              step="0.01"
              defaultValue={formatUsdt(settings.withdrawalFeePercent)}
              className="mt-1"
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Minimum withdrawal USDT
            <Input
              name="minimumWithdrawalAmount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={formatUsdt(settings.minimumWithdrawalAmount)}
              className="mt-1"
            />
          </label>
          <label className="text-xs font-semibold text-slate-600">
            Wrong-answer reward %
            <Input
              name="wrongAnswerRewardPercent"
              type="number"
              min="0"
              max="100"
              step="0.01"
              defaultValue={formatUsdt(settings.wrongAnswerRewardPercent)}
              className="mt-1"
            />
          </label>
          <div>
            <p className="text-xs font-semibold text-slate-600">
              AI training days
            </p>
            <p className="mt-1 text-xs text-[var(--muted)]">
              Users can train only on the selected days.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {trainingDays.map((day) => (
                <label
                  key={day.value}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700"
                >
                  <input
                    type="checkbox"
                    name="trainingAllowedWeekdays"
                    value={day.value}
                    defaultChecked={allowedTrainingDays.has(day.value)}
                  />
                  {day.label}
                </label>
              ))}
            </div>
          </div>
          <Button type="submit">Save global settings</Button>
        </form>
      </Card>
    </div>
  );
}
