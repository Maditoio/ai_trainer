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
  savedPolygonAddress,
  hasPendingWithdrawal,
}: {
  balance: string;
  feePercent: string;
  minimumWithdrawalAmount: string;
  savedPolygonAddress: string;
  hasPendingWithdrawal: boolean;
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
  const polygonAddressPattern = "^0x[a-fA-F0-9]{40}$";
  const canSubmit = !isPending && !balanceBelowMinimum && !hasPendingWithdrawal;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        const result = await createWithdrawalRequest(formData);
        if (result.error) {
          setError(result.error);
          return;
        }
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
      {hasPendingWithdrawal && (
        <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          You already have a pending withdrawal request. Please wait for review
          before submitting another one.
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
        {savedPolygonAddress ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-600">
              Saved Polygon wallet
            </p>
            <p className="mt-1 break-all font-mono text-sm text-slate-900">
              {savedPolygonAddress}
            </p>
            <input
              type="hidden"
              name="polygonAddress"
              value={savedPolygonAddress}
            />
          </div>
        ) : (
          <div>
            <Label htmlFor="polygonAddress">Polygon wallet address</Label>
            <Input
              id="polygonAddress"
              name="polygonAddress"
              placeholder="0x…"
              pattern={polygonAddressPattern}
              title="Enter a valid Polygon wallet address starting with 0x followed by 40 hexadecimal characters."
              required
              className="mt-1 font-mono text-sm"
            />
            <p className="mt-1 text-xs text-[var(--muted)]">
              Add this once. We will save it for future withdrawals.
            </p>
          </div>
        )}
        <Button type="submit" className="w-full" disabled={!canSubmit}>
          {isPending ? "Submitting…" : "Request withdrawal"}
        </Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Card>
  );
}
