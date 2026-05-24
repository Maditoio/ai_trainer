import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { tiers } from "@/lib/db/schema";
import { deleteTier, upsertTier } from "@/lib/actions/tier";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function AdminTiersPage() {
  const allTiers = await db.query.tiers.findMany({
    orderBy: [asc(tiers.sortOrder)],
  });

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
