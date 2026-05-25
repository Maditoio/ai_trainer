import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { tiers } from "@/lib/db/schema";
import { deleteTier, upsertTier } from "@/lib/actions/tier";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function AdminTiersPage() {
  const allTiers = await db.query.tiers.findMany({
    orderBy: [asc(tiers.sortOrder)],
  });
  const tierNameById = new Map(allTiers.map((tier) => [tier.id, tier.name]));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Tiers</h1>

      <Card>
        <CardTitle>Create tier</CardTitle>
        <form action={upsertTier} className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <Label>Name</Label>
            <Input name="name" required />
          </div>
          <div>
            <Label>Daily question limit</Label>
            <Input name="dailyQuestionLimit" type="number" required />
          </div>
          <div>
            <Label>USDT per question</Label>
            <Input name="usdtPerQuestion" defaultValue="0.01" required />
          </div>
          <div>
            <Label>Upgrade price USDT</Label>
            <Input name="upgradePriceUsdt" defaultValue="0" required />
          </div>
          <div>
            <Label>Sort order</Label>
            <Input name="sortOrder" type="number" defaultValue="0" />
          </div>
          <div>
            <Label>Required referrals</Label>
            <Input name="requiredReferralCount" type="number" min="0" defaultValue="0" />
          </div>
          <div>
            <Label>Referral minimum tier</Label>
            <p className="mb-1 text-xs text-[var(--muted)]">
              Required referrals must be on this tier or a higher tier.
            </p>
            <select
              name="requiredReferralTierId"
              className="min-h-11 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-base"
            >
              <option value="">Any referred user</option>
              {allTiers.map((tier) => (
                <option key={tier.id} value={tier.id}>
                  {tier.name} or higher
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isDefault" /> Default tier
            </label>
          </div>
          <Button type="submit">Create</Button>
        </form>
      </Card>

      <ul className="space-y-4">
        {allTiers.map((tier) => (
          <li key={tier.id}>
            <Card>
              <form
                action={async (formData) => {
                  "use server";
                  await upsertTier(formData, tier.id);
                }}
                className="grid gap-3 md:grid-cols-2"
              >
                <div>
                  <Label>Name</Label>
                  <Input name="name" defaultValue={tier.name} required />
                </div>
                <div>
                  <Label>Daily limit</Label>
                  <Input
                    name="dailyQuestionLimit"
                    type="number"
                    defaultValue={tier.dailyQuestionLimit}
                    required
                  />
                </div>
                <div>
                  <Label>USDT / question</Label>
                  <Input
                    name="usdtPerQuestion"
                    defaultValue={tier.usdtPerQuestion}
                    required
                  />
                </div>
                <div>
                  <Label>Upgrade price</Label>
                  <Input
                    name="upgradePriceUsdt"
                    defaultValue={tier.upgradePriceUsdt}
                    required
                  />
                </div>
                <div>
                  <Label>Sort order</Label>
                  <Input name="sortOrder" type="number" defaultValue={tier.sortOrder} />
                </div>
                <div>
                  <Label>Required referrals</Label>
                  <Input
                    name="requiredReferralCount"
                    type="number"
                    min="0"
                    defaultValue={tier.requiredReferralCount}
                  />
                </div>
                <div>
                  <Label>Referral minimum tier</Label>
                  <p className="mb-1 text-xs text-[var(--muted)]">
                    Current:{" "}
                    {tier.requiredReferralTierId
                      ? `${tierNameById.get(tier.requiredReferralTierId) ?? "Unknown tier"} or higher`
                      : "Any referred user"}
                  </p>
                  <select
                    name="requiredReferralTierId"
                    defaultValue={tier.requiredReferralTierId ?? ""}
                    className="min-h-11 w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-base"
                  >
                    <option value="">Any referred user</option>
                    {allTiers.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name} or higher
                      </option>
                    ))}
                  </select>
                </div>
                <CardDescription className="md:col-span-2">
                  Referral requirement: {tier.requiredReferralCount} referral
                  {tier.requiredReferralCount === 1 ? "" : "s"}{" "}
                  {tier.requiredReferralTierId
                    ? `on ${tierNameById.get(tier.requiredReferralTierId) ?? "the selected tier"} or higher`
                    : "from any tier"}
                </CardDescription>
                <div className="flex items-end gap-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      name="isDefault"
                      defaultChecked={tier.isDefault}
                    />
                    Default
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Save</Button>
                </div>
              </form>
              {!tier.isDefault && (
                <form
                  action={async () => {
                    "use server";
                    await deleteTier(tier.id);
                  }}
                  className="mt-2"
                >
                  <Button type="submit" variant="destructive">
                    Delete
                  </Button>
                </form>
              )}
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
