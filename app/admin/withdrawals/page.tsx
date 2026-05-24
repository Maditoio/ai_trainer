import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users, withdrawalRequests } from "@/lib/db/schema";
import { reviewWithdrawal } from "@/lib/actions/withdrawals";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

export default async function AdminWithdrawalsPage() {
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
      {enriched.length === 0 ? (
        <p className="text-[var(--muted)]">No pending withdrawals.</p>
      ) : (
        <ul className="space-y-4">
          {enriched.map((w) => (
            <li key={w.id}>
              <Card>
                <CardTitle className="text-base">
                  {w.amount} USDT — {w.email}
                </CardTitle>
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
