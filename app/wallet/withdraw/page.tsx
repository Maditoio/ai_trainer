import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getWithdrawalHistory } from "@/lib/actions/withdrawals";
import { getGlobalWithdrawalSettings } from "@/lib/withdrawals/settings";
import { getWalletBalance } from "@/lib/wallet/ledger";
import { formatUsdt } from "@/lib/utils";
import { WithdrawForm } from "@/components/wallet/withdraw-form";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default async function WithdrawPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const balance = await getWalletBalance(session.user.id);
  const withdrawals = await getWithdrawalHistory();
  const settings = await getGlobalWithdrawalSettings();

  return (
    <div className="space-y-6">
      <Link href="/wallet" className="text-sm text-indigo-600">
        ← Wallet
      </Link>
      <h1 className="text-2xl font-bold">Withdraw</h1>

      <WithdrawForm
        balance={balance}
        feePercent={settings.withdrawalFeePercent}
        minimumWithdrawalAmount={settings.minimumWithdrawalAmount}
      />

      <section>
        <h2 className="mb-3 font-semibold">Withdrawal history</h2>
        <ul className="space-y-2">
          {withdrawals.map((w) => (
            <li key={w.id}>
              <Card className="flex justify-between gap-2">
                <div>
                  <p className="font-medium">{formatUsdt(w.amount)} USDT requested</p>
                  <p className="text-xs text-[var(--muted)]">
                    Fee {formatUsdt(w.feeAmount)} USDT · payout {formatUsdt(w.netAmount)} USDT
                  </p>
                  <p className="break-all font-mono text-xs text-[var(--muted)]">
                    {w.polygonAddress}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {w.createdAt?.toLocaleString()}
                  </p>
                </div>
                <Badge>{w.status}</Badge>
              </Card>
            </li>
          ))}
          {withdrawals.length === 0 && (
            <p className="text-sm text-[var(--muted)]">No withdrawals yet.</p>
          )}
        </ul>
      </section>
    </div>
  );
}
