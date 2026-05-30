import Link from "next/link";
import { redirect } from "next/navigation";
import { getCryptoDepositHistory } from "@/lib/actions/crypto";
import { getWithdrawalHistory } from "@/lib/actions/withdrawals";
import { getRecentWalletLedgerEntries, getWalletBalance } from "@/lib/wallet/ledger";
import { auth } from "@/lib/auth";
import { getUserTier } from "@/lib/quota";
import { formatAppDateTime, formatUsdt } from "@/lib/utils";
import { DepositForm } from "@/components/wallet/deposit-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { ArrowDownLeft, ArrowUpRight, ChevronRight, History } from "lucide-react";

export default async function WalletPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const balance = await getWalletBalance(session.user.id);
  const tier = await getUserTier(session.user.id);
  const cryptoDeposits = await getCryptoDepositHistory();
  const withdrawals = await getWithdrawalHistory();
  const rewards = await getRecentWalletLedgerEntries(session.user.id, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Wallet</h1>
        <p className="text-sm text-[var(--muted)]">USDT on Polygon</p>
      </div>

      <Card className="gradient-bg border-0 text-white">
        <CardDescription className="text-indigo-100">Balance</CardDescription>
        <p className="mt-1 text-4xl font-bold tracking-tight">{formatUsdt(balance)}</p>
        <p className="text-sm text-indigo-100">USDT</p>
        <div className="mt-4 flex gap-2">
          <Link href="/wallet/deposits" className="flex-1">
            <Button variant="outline" className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20">
              <ArrowDownLeft className="mr-1 h-4 w-4" />
              Deposits
            </Button>
          </Link>
          <Link href="/wallet/withdraw" className="flex-1">
            <Button variant="outline" className="w-full border-white/30 bg-white/10 text-white hover:bg-white/20">
              <ArrowUpRight className="mr-1 h-4 w-4" />
              Withdraw
            </Button>
          </Link>
        </div>
      </Card>

      <Card className="bg-emerald-50 border-emerald-200">
        <CardTitle className="text-emerald-900">
          Your {tier?.name ?? "current"} package
        </CardTitle>
        <CardDescription className="text-emerald-800">
          Earn {formatUsdt(tier?.usdtPerQuestion ?? "0")} USDT per completed training
          question, up to {tier?.dailyQuestionLimit ?? 0} per day. Packages with
          more than one daily question wait 1 hour between answers.
        </CardDescription>
        <Link href="/tasks" className="mt-3 inline-block">
          <Button variant="accent" className="text-sm">
            Start training
          </Button>
        </Link>
      </Card>

      <DepositForm />

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Recent activity</h2>
          <Link href="/history" className="flex items-center text-sm text-indigo-600">
            <History className="mr-1 h-4 w-4" />
            Earnings
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <ul className="space-y-2">
          {rewards.map((entry) => (
            <li key={entry.id}>
              <Card className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">
                    {entry.type === "free_training_bonus"
                      ? "Daily training reward"
                      : "Task reward"}
                  </p>
                  <p className="text-xs text-[var(--muted)]">
                    {formatAppDateTime(entry.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-600">
                    +{formatUsdt(entry.amount)} USDT
                  </p>
                  <Badge className="bg-emerald-100 text-emerald-700">Credited</Badge>
                </div>
              </Card>
            </li>
          ))}
          {cryptoDeposits.slice(0, 3).map((d) => (
            <li key={d.id}>
              <Card className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">Crypto deposit</p>
                  <p className="text-xs text-[var(--muted)]">
                    {formatAppDateTime(d.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{formatUsdt(d.priceAmount)} USDT</p>
                  <Badge
                    className={
                      d.creditedAt
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }
                  >
                    {d.creditedAt ? "Credited" : d.paymentStatus}
                  </Badge>
                </div>
              </Card>
            </li>
          ))}
          {withdrawals.slice(0, 3).map((w) => (
            <li key={w.id}>
              <Card className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">Withdrawal</p>
                  <p className="text-xs text-[var(--muted)]">
                    {formatAppDateTime(w.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">-{formatUsdt(w.amount)} USDT</p>
                  <Badge>{w.status}</Badge>
                </div>
              </Card>
            </li>
          ))}
          {rewards.length === 0 && cryptoDeposits.length === 0 && withdrawals.length === 0 && (
            <p className="text-sm text-[var(--muted)]">No activity yet.</p>
          )}
        </ul>
      </section>
    </div>
  );
}
