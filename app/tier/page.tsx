import { getTiersForUpgrade, upgradeTier } from "@/lib/actions/tier";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatUsdt } from "@/lib/utils";

export default async function TierPage() {
  const data = await getTiersForUpgrade();
  if (!data) return null;
  const hasTier = !!data.currentTier;
  const currentSortOrder = data.currentTier?.sortOrder ?? -Infinity;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-indigo-600">Packages</p>
        <h1 className="text-2xl font-bold text-slate-900">
          Choose your training tier
        </h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Balance: {formatUsdt(data.balance)} USDT · Current:{" "}
          {data.currentTier?.name ?? "No tier yet"}
        </p>
      </div>

      {!hasTier && (
        <Card className="border-amber-200 bg-amber-50">
          <CardTitle className="text-amber-950">Upgrade required</CardTitle>
          <CardDescription className="mt-2 text-amber-800">
            You can complete free training without a tier, but paid AI training
            tasks unlock after choosing a package.
          </CardDescription>
        </Card>
      )}

      <ul className="grid gap-4">
        {data.allTiers.map((tier) => {
          const isCurrent = data.currentTier?.id === tier.id;
          const price = parseFloat(tier.upgradePriceUsdt);
          const canAfford = parseFloat(data.balance) >= price;
          const isHigherTier = !hasTier || tier.sortOrder > currentSortOrder;
          const referralEligibility = data.referralEligibility.find(
            (item) => item.tierId === tier.id,
          );
          const hasReferrals = referralEligibility?.eligible ?? true;
          const canUpgrade = isHigherTier && (price === 0 || canAfford) && hasReferrals;

          return (
            <li key={tier.id}>
              <Card className={isCurrent ? "border-indigo-300 bg-indigo-50" : ""}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{tier.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {tier.dailyQuestionLimit} paid task
                      {tier.dailyQuestionLimit === 1 ? "" : "s"} per day
                    </CardDescription>
                  </div>
                  <Badge>{isCurrent ? "Current" : `${formatUsdt(tier.upgradePriceUsdt)} USDT`}</Badge>
                </div>
                <CardDescription className="mt-2 space-y-1">
                  <p>{formatUsdt(tier.usdtPerQuestion)} USDT per correct answer</p>
                  <p>Upgrade: {formatUsdt(tier.upgradePriceUsdt)} USDT</p>
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
                  <p className="mt-4 text-sm font-semibold text-indigo-700">
                    You are currently on this tier.
                  </p>
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
                      className="w-full"
                      disabled={!canUpgrade}
                    >
                      {!isHigherTier
                        ? "Higher tier only"
                        : !hasReferrals
                        ? "Need referrals"
                        : !canAfford
                          ? "Insufficient balance"
                        : price === 0
                          ? "Choose tier"
                          : hasTier
                            ? "Upgrade"
                            : "Choose tier"}
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
