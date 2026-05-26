import { getAdminUsers, updateUserWithdrawalSettings } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default async function AdminUsersPage() {
  const allUsers = await getAdminUsers();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Set each user&apos;s withdrawal fee and minimum withdrawal amount.
        </p>
      </div>

      <div className="space-y-4">
        {allUsers.map((u) => (
          <Card key={u.id} className="space-y-4">
            <div>
              <CardTitle className="break-all text-base">{u.email}</CardTitle>
              <CardDescription className="mt-1">
                {u.role} · Balance {u.balance} USDT
              </CardDescription>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
              <h2 className="font-semibold text-slate-900">Withdrawal limits</h2>
              <p className="mt-1 text-xs text-slate-600">
                Current fee: {u.withdrawalFeePercent}% · Minimum:{" "}
                {u.minimumWithdrawalAmount} USDT
              </p>
              <form
                action={async (formData) => {
                  "use server";
                  await updateUserWithdrawalSettings(u.id, formData);
                }}
                className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
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
                    className="mt-1 bg-white"
                  />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  Minimum withdrawal USDT
                  <Input
                    name="minimumWithdrawalAmount"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={u.minimumWithdrawalAmount}
                    className="mt-1 bg-white"
                  />
                </label>
                <Button type="submit" className="self-end">
                  Save limits
                </Button>
              </form>
            </div>
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
