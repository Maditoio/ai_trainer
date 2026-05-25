import { getTiersForUpgrade, upgradeTier } from "@/lib/actions/tier";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function TierPage() {
  const data = await getTiersForUpgrade();
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upgrade tier</h1>
        <p className="text-foreground/60">
          Balance: {data.balance} USDT · Current: {data.currentTier?.name ?? "None"}
        </p>
      </div>

      <ul className="grid gap-4 md:grid-cols-2">
        {data.allTiers.map((tier) => {
          const isCurrent = data.currentTier?.id === tier.id;
          const price = parseFloat(tier.upgradePriceUsdt);
          const canAfford = parseFloat(data.balance) >= price;
          const referralEligibility = data.referralEligibility.find(
            (item) => item.tierId === tier.id,
          );
          const hasReferrals = referralEligibility?.eligible ?? true;
          const canUpgrade = (price === 0 || canAfford) && hasReferrals;

          return (
            <li key={tier.id}>
              <Card>
                <CardTitle>{tier.name}</CardTitle>
                <CardDescription className="mt-2 space-y-1">
                  <p>{tier.dailyQuestionLimit} questions / day</p>
                  <p>{tier.usdtPerQuestion} USDT per correct answer</p>
                  <p>Upgrade: {tier.upgradePriceUsdt} USDT</p>
                  {tier.requiredReferralCount > 0 && (
                    <p>
                      Referrals: {referralEligibility?.qualifiedCount ?? 0}/
                      {tier.requiredReferralCount}
                      {referralEligibility?.requiredTier
                        ? ` using ${referralEligibility.requiredTier.name} or higher`
                        : " joined"}
                    </p>
                  )}
                </CardDescription>
                {isCurrent ? (
                  <p className="mt-4 text-sm font-medium">Current tier</p>
                ) : (
                  <form
                    action={async () => {
                      "use server";
                      await upgradeTier(tier.id);
                    }}
                    className="mt-4"
                  >
                    <Button
                      type="submit"
                      disabled={!canUpgrade}
                    >
                      {!hasReferrals
                        ? "Need referrals"
                        : price === 0
                          ? "Switch"
                          : "Upgrade"}
                    </Button>
                  </form>
                )}
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
