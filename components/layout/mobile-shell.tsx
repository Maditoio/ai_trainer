import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import {
  Brain,
  History,
  Home,
  Layers,
  LogOut,
  Shield,
  Wallet,
} from "lucide-react";

const userNav = [
  { href: "/dashboard", label: "Home", icon: Home },
  { href: "/tasks", label: "Train", icon: Brain },
  { href: "/tier", label: "Tiers", icon: Layers },
  { href: "/history", label: "History", icon: History },
  { href: "/wallet", label: "Wallet", icon: Wallet },
];

const adminNav = [
  { href: "/admin", label: "Admin", icon: Shield },
  { href: "/admin/tasks", label: "Tasks", icon: Brain },
  { href: "/admin/withdrawals", label: "Payouts", icon: Wallet },
];

export async function MobileShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";
  const nav = isAdmin ? adminNav : userNav;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/90 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-center justify-between">
          <Link
            href={session?.user ? (isAdmin ? "/admin" : "/dashboard") : "/"}
            className="flex items-center gap-2"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl gradient-bg text-white">
              <Brain className="h-5 w-5" />
            </span>
            <span className="font-bold text-slate-900">
              Model<span className="gradient-text">Mind</span>
            </span>
          </Link>
          {session?.user && (
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-600 shadow-sm hover:bg-slate-50"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign out</span>
              </button>
            </form>
          )}
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-5 pb-28">
        {children}
      </main>

      {session?.user && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--border)] bg-white px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_24px_rgba(15,23,42,0.08)]">
          <div className="mx-auto flex max-w-lg justify-around">
            {nav.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex min-w-[4rem] flex-col items-center gap-0.5 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-indigo-50 hover:text-indigo-600"
              >
                <Icon className="h-6 w-6" />
                {label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
