import { and, desc, eq, gte, isNotNull, lte } from "drizzle-orm";
import { db } from "@/lib/db";
import { cryptoDeposits, depositRequests, users } from "@/lib/db/schema";
import { reviewDepositRequest } from "@/lib/actions/wallet";
import { formatAppDateTime, formatUsdt } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminDepositsPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const from = firstValue(resolvedSearchParams.from) ?? "";
  const to = firstValue(resolvedSearchParams.to) ?? "";
  const fromDate = from ? new Date(`${from}T00:00:00.000Z`) : null;
  const toDate = to ? new Date(`${to}T23:59:59.999Z`) : null;
  const confirmedFilters = [
    isNotNull(cryptoDeposits.creditedAt),
    fromDate && !Number.isNaN(fromDate.getTime())
      ? gte(cryptoDeposits.creditedAt, fromDate)
      : undefined,
    toDate && !Number.isNaN(toDate.getTime())
      ? lte(cryptoDeposits.creditedAt, toDate)
      : undefined,
  ].filter(Boolean);

  const pending = await db.query.depositRequests.findMany({
    where: eq(depositRequests.status, "pending"),
  });
  const confirmedCryptoDeposits = await db.query.cryptoDeposits.findMany({
    where: and(...confirmedFilters),
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
  const confirmedTotal = enrichedCryptoDeposits.reduce(
    (sum, d) => sum + parseFloat(d.actuallyPaid ?? d.priceAmount),
    0,
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
        <div className="space-y-3">
          <div>
            <h2 className="font-semibold text-slate-900">
              Confirmed crypto deposits
            </h2>
            <p className="text-sm text-[var(--muted)]">
              Total confirmed:{" "}
              <strong className="text-slate-900">
                {formatUsdt(confirmedTotal)} USDT
              </strong>
            </p>
          </div>
          <Card>
            <form className="grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-semibold text-slate-600">
                From
                <Input
                  name="from"
                  type="date"
                  defaultValue={from}
                  className="mt-1"
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                To
                <Input
                  name="to"
                  type="date"
                  defaultValue={to}
                  className="mt-1"
                />
              </label>
              <div className="flex items-end gap-2">
                <Button type="submit" className="flex-1">
                  Filter
                </Button>
                <a href="/admin/deposits" className="flex-1">
                  <Button type="button" variant="outline" className="w-full">
                    Clear
                  </Button>
                </a>
              </div>
            </form>
          </Card>
        </div>
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
                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-2xl bg-slate-50 p-3 text-sm">
                    <div>
                      <p className="text-xs font-semibold text-slate-500">
                        Full amount paid
                      </p>
                      <p className="font-bold text-slate-900">
                        {formatUsdt(d.actuallyPaid ?? d.priceAmount)} USDT
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500">
                        Expected amount
                      </p>
                      <p className="font-bold text-slate-900">
                        {formatUsdt(d.priceAmount)} USDT
                      </p>
                    </div>
                  </div>
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
