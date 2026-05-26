import { getAdminUsers } from "@/lib/actions/admin";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function AdminUsersPage() {
  const allUsers = await getAdminUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          View registered users and wallet balances.
        </p>
      </div>

      <div className="space-y-4">
        {allUsers.map((u) => (
          <Card key={u.id}>
            <CardTitle className="break-all text-base">{u.email}</CardTitle>
            <CardDescription className="mt-1">
              {u.role} · Balance {u.balance} USDT
            </CardDescription>
          </Card>
        ))}
        {allUsers.length === 0 && (
          <Card>
            <CardTitle>No users yet</CardTitle>
            <CardDescription className="mt-2">
              Users will appear here after they register.
            </CardDescription>
          </Card>
        )}
      </div>

      <Card>
        <CardTitle className="text-base">Note</CardTitle>
        <p className="mt-2 text-sm text-foreground/60">
          Set ADMIN_EMAIL in env to auto-promote that email to admin on register.
        </p>
      </Card>
    </div>
  );
}
