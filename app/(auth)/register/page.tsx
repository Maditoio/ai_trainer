import Link from "next/link";
import { registerAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-sm space-y-6 pt-4">
      <div className="text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl gradient-bg text-white">
          <Brain className="h-8 w-8" />
        </span>
        <h1 className="mt-4 text-2xl font-bold text-slate-900">Join AI Trainer</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Earn USDT per training question based on your package
        </p>
      </div>

      <Card>
        <form action={registerAction} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" type="text" className="mt-1" />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required className="mt-1" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              minLength={6}
              required
              className="mt-1"
            />
          </div>
          <Button type="submit" className="w-full">
            Create account
          </Button>
        </form>
      </Card>

      <p className="text-center text-sm text-[var(--muted)]">
        Have an account?{" "}
        <Link href="/login" className="font-semibold text-indigo-600">
          Sign in
        </Link>
      </p>
    </div>
  );
}
