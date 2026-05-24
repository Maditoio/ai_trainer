import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { depositRequests, users } from "@/lib/db/schema";
import { reviewDepositRequest } from "@/lib/actions/wallet";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";

export default async function AdminDepositsPage() {
  const pending = await db.query.depositRequests.findMany({
    where: eq(depositRequests.status, "pending"),
  });

  const enriched = await Promise.all(
    pending.map(async (d) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, d.userId),
      });
      return { ...d, email: user?.email };
    }),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Deposit requests</h1>
      {enriched.length === 0 ? (
        <p className="text-foreground/60">No pending deposits.</p>
      ) : (
        <ul className="space-y-4">
          {enriched.map((d) => (
            <li key={d.id}>
              <Card>
                <CardTitle className="text-base">
                  {d.amount} USDT — {d.email}
                </CardTitle>
                <p className="text-sm text-foreground/60">{d.referenceNote}</p>
                <div className="mt-4 flex gap-2">
                  <form
                    action={async () => {
                      "use server";
                      await reviewDepositRequest(d.id, "approve");
                    }}
                  >
                    <Button type="submit">Approve</Button>
                  </form>
                  <form
                    action={async () => {
                      "use server";
                      await reviewDepositRequest(d.id, "reject");
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
