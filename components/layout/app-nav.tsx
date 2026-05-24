import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export async function AppNav() {
  const session = await auth();
  if (!session?.user) return null;

  const isAdmin = session.user.role === "admin";
  const links = isAdmin
    ? [
        { href: "/admin", label: "Admin" },
        { href: "/admin/tiers", label: "Tiers" },
        { href: "/admin/tasks", label: "Tasks" },
        { href: "/admin/free-training", label: "Free training" },
        { href: "/admin/deposits", label: "Deposits" },
        { href: "/admin/users", label: "Users" },
      ]
    : [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/tasks", label: "Tasks" },
        { href: "/free-training", label: "Free Training" },
        { href: "/wallet", label: "Wallet" },
        { href: "/tier", label: "Upgrade Tier" },
      ];

  return (
    <header className="border-b border-foreground/10">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
        <Link href={isAdmin ? "/admin" : "/dashboard"} className="font-semibold">
          AI Trainer
        </Link>
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:underline">
              {l.label}
            </Link>
          ))}
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button type="submit" variant="outline" className="py-1">
              Sign out
            </Button>
          </form>
        </nav>
      </div>
    </header>
  );
}
