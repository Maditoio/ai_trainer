"use client";

import { useState, useTransition } from "react";
import { createCryptoDeposit } from "@/lib/actions/crypto";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, QrCode } from "lucide-react";

type DepositResult = {
  payAddress: string;
  payAmount?: number;
  payCurrency: string;
  priceAmount: string;
};

export function DepositForm() {
  const [amount, setAmount] = useState("10");
  const [result, setResult] = useState<DepositResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const res = await createCryptoDeposit(amount);
        setResult({
          payAddress: res.payAddress,
          payAmount: res.payAmount,
          payCurrency: res.payCurrency,
          priceAmount: res.priceAmount,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create deposit");
      }
    });
  }

  async function copyAddress() {
    if (result?.payAddress) await navigator.clipboard.writeText(result.payAddress);
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardTitle>Deposit USDT (Polygon)</CardTitle>
        <CardDescription className="mt-1">
          We generate a unique address via NOWPayments. Your wallet credits
          automatically when the payment confirms.
        </CardDescription>
        <form onSubmit={onSubmit} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="amount">Amount (USD)</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Generating address…" : "Get deposit address"}
          </Button>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </Card>

      {result && (
        <Card className="border-indigo-200 bg-indigo-50/50">
          <div className="flex items-center gap-2 text-indigo-700">
            <QrCode className="h-5 w-5" />
            <CardTitle className="text-indigo-900">Send USDT to this address</CardTitle>
          </div>
          <CardDescription className="mt-2">
            Network: Polygon · Expected ~{result.priceAmount} USD in USDT
            {result.payAmount != null && (
              <> · Pay {result.payAmount} {result.payCurrency}</>
            )}
          </CardDescription>
          <p className="mt-3 break-all rounded-xl bg-white p-3 font-mono text-sm text-slate-800">
            {result.payAddress}
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-3 w-full"
            onClick={copyAddress}
          >
            <Copy className="mr-2 h-4 w-4" />
            Copy address
          </Button>
        </Card>
      )}
    </div>
  );
}
