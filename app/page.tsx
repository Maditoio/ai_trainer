import Link from "next/link";
import { auth } from "@/lib/auth";
import { TRAINING_REWARD_USDT } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Brain, Coins, Smartphone, Wallet } from "lucide-react";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="space-y-8 pb-8">
      <section className="pt-4 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-bg text-white shadow-lg shadow-indigo-500/30">
          <Brain className="h-9 w-9" />
        </span>
        <h1 className="mt-5 text-3xl font-bold text-slate-900">
          Train AI.<br />
          <span className="gradient-text">Earn USDT.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-[var(--muted)]">
          Mobile-first training tasks. {TRAINING_REWARD_USDT} USDT per correct
          answer, once per day. Deposit & withdraw on Polygon.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          {session ? (
            <Link href="/dashboard">
              <Button className="w-full">Open app</Button>
            </Link>
          ) : (
            <>
              <Link href="/register">
                <Button className="w-full">Get started free</Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full">
                  Sign in
                </Button>
              </Link>
            </>
          )}
        </div>
      </section>

      <div className="grid gap-3">
        <Card className="flex gap-4">
          <Coins className="h-8 w-8 shrink-0 text-amber-500" />
          <div>
            <CardTitle className="text-base">Daily earnings</CardTitle>
            <CardDescription>
              {TRAINING_REWARD_USDT} USDT for each training question you complete
              today.
            </CardDescription>
          </div>
        </Card>
        <Card className="flex gap-4">
          <Wallet className="h-8 w-8 shrink-0 text-indigo-500" />
          <div>
            <CardTitle className="text-base">USDT on Polygon</CardTitle>
            <CardDescription>
              Deposit via NOWPayments. Withdraw to your wallet when you are ready.
            </CardDescription>
          </div>
        </Card>
        <Card className="flex gap-4">
          <Smartphone className="h-8 w-8 shrink-0 text-cyan-500" />
          <div>
            <CardTitle className="text-base">Built for mobile</CardTitle>
            <CardDescription>
              Quick tasks, clear progress, and a wallet that fits in your pocket.
            </CardDescription>
          </div>
        </Card>
      </div>
    </div>
  );
}
