import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, withdrawalRequests } from "@/lib/db/schema";
import { reviewWithdrawal } from "@/lib/actions/withdrawals";
import { formatUsdt } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function AdminWithdrawalRequestsPage() {
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
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Withdrawal requests</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Review pending user payout requests.
          </p>
        </div>
        <div className="grid gap-2">
          <a href="/admin/withdrawal-requests/export">
            <Button>Export CSV</Button>
          </a>
          <Link href="/admin/withdrawals">
            <Button variant="outline">Settings</Button>
          </Link>
        </div>
      </div>

      {enriched.length === 0 ? (
        <Card>
          <CardTitle>No pending withdrawals</CardTitle>
          <CardDescription className="mt-2">
            New withdrawal requests will appear here.
          </CardDescription>
        </Card>
      ) : (
        <ul className="space-y-4">
          {enriched.map((w) => (
            <li key={w.id}>
              <Card>
                <CardTitle className="text-base">
                  {formatUsdt(w.amount)} USDT - {w.email}
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
