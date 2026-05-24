import Link from "next/link";
import { loginAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm space-y-6 pt-4">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl gradient-bg text-white">
          <Brain className="h-8 w-8" />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Sign in</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Train AI · earn USDT daily
        </p>
      </div>

      <Card>
        <form action={loginAction} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full">
            Sign in
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-[var(--muted)]">
        New here?{" "}
        <Link href="/register" className="font-semibold text-indigo-600">
          Create account
        </Link>
      </p>
    </div>
  );
}
