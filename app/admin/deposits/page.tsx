import { desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { cryptoDeposits, depositRequests, users } from "@/lib/db/schema";
import { reviewDepositRequest } from "@/lib/actions/wallet";
import { formatAppDateTime, formatUsdt } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function AdminDepositsPage() {
  const pending = await db.query.depositRequests.findMany({
    where: eq(depositRequests.status, "pending"),
  });
  const confirmedCryptoDeposits = await db.query.cryptoDeposits.findMany({
    where: isNotNull(cryptoDeposits.creditedAt),
    orderBy: [desc(cryptoDeposits.creditedAt)],
  });

  const enriched = await Promise.all(
    pending.map(async (d) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, d.userId),
      });
      return { ...d, email: user?.email };
    }),
  );
  const enrichedCryptoDeposits = await Promise.all(
    confirmedCryptoDeposits.map(async (d) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, d.userId),
      });
      return { ...d, email: user?.email };
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Deposits</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Review manual deposits and confirmed crypto deposits.
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900">Pending manual deposits</h2>
        {enriched.length === 0 ? (
          <p className="text-foreground/60">No pending deposits.</p>
        ) : (
          <ul className="space-y-4">
            {enriched.map((d) => (
              <li key={d.id}>
                <Card>
                  <CardTitle className="text-base">
                    {formatUsdt(d.amount)} USDT - {d.email}
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
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold text-slate-900">
          Confirmed crypto deposits
        </h2>
        {enrichedCryptoDeposits.length === 0 ? (
          <Card>
            <CardTitle className="text-base">No confirmed crypto deposits</CardTitle>
            <CardDescription className="mt-1">
              NOWPayments deposits will appear here after they are credited.
            </CardDescription>
          </Card>
        ) : (
          <ul className="space-y-4">
            {enrichedCryptoDeposits.map((d) => (
              <li key={d.id}>
                <Card>
                  <CardTitle className="text-base">
                    {formatUsdt(d.actuallyPaid ?? d.priceAmount)} USDT - {d.email}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Status: {d.paymentStatus} · Credited:{" "}
                    {formatAppDateTime(d.creditedAt)}
                  </CardDescription>
                  <p className="mt-2 break-all font-mono text-xs text-[var(--muted)]">
                    Payment ID: {d.nowpaymentsPaymentId}
                  </p>
                  <p className="mt-1 break-all font-mono text-xs text-[var(--muted)]">
                    Deposit address: {d.payAddress}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
