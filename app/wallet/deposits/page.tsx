import Link from "next/link";
import { getCryptoDepositHistory } from "@/lib/actions/crypto";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default async function DepositsHistoryPage() {
  const deposits = await getCryptoDepositHistory();

  return (
    <div className="space-y-4">
      <Link href="/wallet" className="text-sm text-indigo-600">
        ← Wallet
      </Link>
      <h1 className="text-2xl font-bold">Deposit history</h1>

      <ul className="space-y-3">
        {deposits.map((d) => (
          <li key={d.id}>
            <Card>
              <div className="flex justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{d.priceAmount} USDT</p>
                  <p className="mt-1 break-all font-mono text-xs text-[var(--muted)]">
                    {d.payAddress}
                  </p>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    {d.createdAt?.toLocaleString()}
                  </p>
                </div>
                <Badge
                  className={
                    d.creditedAt
                      ? "shrink-0 bg-emerald-100 text-emerald-700"
                      : "shrink-0 bg-amber-100 text-amber-700"
                  }
                >
                  {d.creditedAt ? "Credited" : d.paymentStatus}
                </Badge>
              </div>
            </Card>
          </li>
        ))}
        {deposits.length === 0 && (
          <p className="text-sm text-[var(--muted)]">No deposits yet.</p>
        )}
      </ul>
    </div>
  );
}
