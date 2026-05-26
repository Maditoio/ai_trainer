import { getAdminUsers, updateUserWithdrawalSettings } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
              <th className="py-2 pr-4">Withdrawal rules</th>
            </tr>
          </thead>
          <tbody>
            {allUsers.map((u) => (
              <tr key={u.id} className="border-b border-foreground/10 align-top">
                <td className="py-3 pr-4">{u.email}</td>
                <td className="py-3 pr-4">{u.role}</td>
                <td className="py-3 pr-4">{u.balance} USDT</td>
                <td className="py-3 pr-4">
                  <form
                    action={async (formData) => {
                      "use server";
                      await updateUserWithdrawalSettings(u.id, formData);
                    }}
                    className="grid min-w-72 gap-2 sm:grid-cols-[1fr_1fr_auto]"
                  >
                    <label className="text-xs font-semibold text-slate-600">
                      Withdrawal fee %
                      <Input
                        name="withdrawalFeePercent"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        defaultValue={u.withdrawalFeePercent}
                        className="mt-1"
                      />
                    </label>
                    <label className="text-xs font-semibold text-slate-600">
                      Minimum withdrawal
                      <Input
                        name="minimumWithdrawalAmount"
                        type="number"
                        min="0"
                        step="0.01"
                        defaultValue={u.minimumWithdrawalAmount}
                        className="mt-1"
                      />
                    </label>
                    <Button type="submit" className="self-end">
                      Save
                    </Button>
                  </form>
                </td>
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
