import { getAdminUsers } from "@/lib/actions/admin";
import { Card, CardTitle } from "@/components/ui/card";

export default async function AdminUsersPage() {
  const allUsers = await getAdminUsers();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Users</h1>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b">
              <th className="py-2 pr-4">Email</th>
              <th className="py-2 pr-4">Role</th>
              <th className="py-2 pr-4">Balance</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((u) => (
              <tr key={u.id} className="border-b border-foreground/10">
                <td className="py-2 pr-4">{u.email}</td>
                <td className="py-2 pr-4">{u.role}</td>
                <td className="py-2 pr-4">{u.balance} USDT</td>
              </tr>
            ))}
          </tbody>
        </table>
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
