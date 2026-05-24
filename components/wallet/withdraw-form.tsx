"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createWithdrawalRequest } from "@/lib/actions/withdrawals";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WithdrawForm({ balance }: { balance: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

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
        Available: <strong>{balance} USDT</strong>. Payouts go to your Polygon
        (MATIC) wallet. Processed after admin review.
      </CardDescription>
      <form onSubmit={onSubmit} className="mt-4 space-y-4">
        <div>
          <Label htmlFor="amount">Amount (USDT)</Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0.01"
            required
            className="mt-1"
          />
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
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Submitting…" : "Request withdrawal"}
        </Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </Card>
  );
}
