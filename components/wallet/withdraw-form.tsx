"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createWithdrawalRequest } from "@/lib/actions/withdrawals";
import { formatUsdt } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WithdrawForm({
  balance,
  feePercent,
  minimumWithdrawalAmount,
}: {
  balance: string;
  feePercent: string;
  minimumWithdrawalAmount: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [isPending, startTransition] = useTransition();
  const amountNum = Number(amount);
  const balanceNum = Number(balance);
  const minimumWithdrawalNum = Number(minimumWithdrawalAmount);
  const balanceBelowMinimum =
    Number.isFinite(balanceNum) &&
    Number.isFinite(minimumWithdrawalNum) &&
    balanceNum < minimumWithdrawalNum;
  const feePercentNum = Number(feePercent);
  const estimatedFee =
    Number.isFinite(amountNum) && amountNum > 0
      ? (amountNum * feePercentNum) / 100
      : 0;
  const estimatedPayout =
    Number.isFinite(amountNum) && amountNum > 0
      ? Math.max(amountNum - estimatedFee, 0)
      : 0;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await createWithdrawalRequest(formData);
        router.push("/wallet");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Request failed");
      }
    });
  }

  return (
    <Card>
      <CardTitle>Withdraw USDT</CardTitle>
      <CardDescription className="mt-1">
        Balance: <strong>{formatUsdt(balance)} USDT</strong> · Minimum:{" "}
        <strong>{formatUsdt(minimumWithdrawalAmount)} USDT</strong> · Fee:{" "}
        <strong>{feePercent}%</strong>
      </CardDescription>
      {balanceBelowMinimum && (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Your balance must be at least {formatUsdt(minimumWithdrawalAmount)} USDT before you
          can request a withdrawal.
        </p>
      )}
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div>
          <Label htmlFor="amount">Amount (USDT)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min={minimumWithdrawalAmount}
            required
            className="mt-1"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
          {amount && (
            <p className="mt-1 text-xs text-[var(--muted)]">
              Fee: {formatUsdt(estimatedFee)} USDT · You receive:{" "}
              {formatUsdt(estimatedPayout)} USDT
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="polygonAddress">Polygon wallet address</Label>
          <Input
            id="polygonAddress"
            name="polygonAddress"
            placeholder="0x…"
            required
            className="mt-1 font-mono text-sm"
          />
        </div>
        <Button type="submit" className="w-full" disabled={isPending || balanceBelowMinimum}>
          {isPending ? "Submitting…" : "Request withdrawal"}
        </Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Card>
  );
}
