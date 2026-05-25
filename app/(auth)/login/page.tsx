import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";
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
          Continue your AI training tasks
        </p>
      </div>

      <Card>
        <LoginForm />
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
