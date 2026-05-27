import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, withdrawalRequests } from "@/lib/db/schema";
import { reviewWithdrawal } from "@/lib/actions/withdrawals";
import { updateGlobalWithdrawalSettings } from "@/lib/actions/admin";
import { getGlobalWithdrawalSettings } from "@/lib/withdrawals/settings";
import { formatUsdt } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function AdminWithdrawalsPage() {
  const settings = await getGlobalWithdrawalSettings();
  const pending = await db.query.withdrawalRequests.findMany({
    where: eq(withdrawalRequests.status, "pending"),
  });

  const enriched = await Promise.all(
    pending.map(async (w) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, w.userId),
      });
      return { ...w, email: user?.email };
    }),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Withdrawal requests</h1>

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
          <Button type="submit">Save global settings</Button>
        </form>
      </Card>

      {enriched.length === 0 ? (
        <p className="text-[var(--muted)]">No pending withdrawals.</p>
      ) : (
        <ul className="space-y-4">
          {enriched.map((w) => (
            <li key={w.id}>
              <Card>
                <CardTitle className="text-base">
                  {formatUsdt(w.amount)} USDT — {w.email}
                </CardTitle>
                <p className="mt-1 text-sm text-slate-700">
                  Fee: {formatUsdt(w.feeAmount)} USDT ({formatUsdt(w.feePercent)}%) · Send:{" "}
                  <strong>{formatUsdt(w.netAmount)} USDT</strong>
                </p>
                <p className="mt-1 break-all font-mono text-xs text-[var(--muted)]">
                  {w.polygonAddress}
                </p>
                <div className="mt-4 flex gap-2">
                  <form
                    action={async () => {
                      "use server";
                      await reviewWithdrawal(w.id, "approve");
                    }}
                  >
                    <Button type="submit">Approve & deduct</Button>
                  </form>
                  <form
                    action={async () => {
                      "use server";
                      await reviewWithdrawal(w.id, "reject");
                    }}
                  >
                    <Button type="submit" variant="outline">
                      Reject
                    </Button>
                  </form>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
