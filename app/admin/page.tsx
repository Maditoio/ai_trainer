import Link from "next/link";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

const links = [
  { href: "/admin/tiers", title: "Tiers", desc: "Manage tier limits and rewards" },
  { href: "/admin/tasks", title: "Tasks", desc: "Create tasks, add questions, go live" },
  { href: "/admin/free-training", title: "Free training", desc: "Onboarding quiz (3 questions)" },
  { href: "/admin/deposits", title: "Deposits", desc: "Legacy manual deposit requests" },
  { href: "/admin/withdrawals", title: "Withdrawals", desc: "Approve user cash-out requests" },
  {
    href: "/admin/users",
    title: "Users",
    desc: "View users, balances, withdrawal fees, and minimum withdrawal limits",
  },
];

export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin</h1>
      <div className="grid gap-4 md:grid-cols-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="hover:border-foreground/30">
              <CardTitle>{l.title}</CardTitle>
              <CardDescription className="mt-2">{l.desc}</CardDescription>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
