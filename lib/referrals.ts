import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tiers, users } from "@/lib/db/schema";

export function makeReferralCode(email: string) {
  const prefix = email.split("@")[0].replace(/[^a-z0-9]/gi, "").slice(0, 6);
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix || "AIT"}-${suffix}`;
}

export function getBaseAppUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "")
  );
}

export function buildReferralLink(referralCode: string) {
  const baseUrl = getBaseAppUrl();
  return baseUrl ? `${baseUrl}/register?ref=${referralCode}` : `/register?ref=${referralCode}`;
}

export async function ensureReferralCode(userId: string, email: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (user?.referralCode) return user.referralCode;

  for (let i = 0; i < 5; i++) {
    const referralCode = makeReferralCode(email);
    const existing = await db.query.users.findFirst({
      where: eq(users.referralCode, referralCode),
    });
    if (!existing) {
      await db.update(users).set({ referralCode }).where(eq(users.id, userId));
      return referralCode;
    }
  }

  throw new Error("Could not create referral code");
}

export async function getReferralStats(userId: string) {
  const directReferrals = await db.query.users.findMany({
    where: eq(users.referredByUserId, userId),
  });

  const allTiers = await db.query.tiers.findMany();
  const tierById = new Map(allTiers.map((tier) => [tier.id, tier]));

  return {
    total: directReferrals.length,
    byTier: allTiers.map((tier) => ({
      tier,
      count: directReferrals.filter((user) => user.currentTierId === tier.id)
        .length,
    })),
    qualifiedAtOrAbove(requiredTierId: string | null, minSortOrder?: number) {
      if (!requiredTierId && minSortOrder == null) return directReferrals.length;
      const requiredTier = requiredTierId ? tierById.get(requiredTierId) : null;
      const threshold = minSortOrder ?? requiredTier?.sortOrder ?? 0;
      return directReferrals.filter((user) => {
        if (!user.currentTierId) return false;
        const tier = tierById.get(user.currentTierId);
        return tier ? tier.sortOrder >= threshold : false;
      }).length;
    },
  };
}

export async function getTierReferralEligibility(userId: string, targetTierId: string) {
  const targetTier = await db.query.tiers.findFirst({
    where: eq(tiers.id, targetTierId),
  });
  if (!targetTier) throw new Error("Tier not found");

  const requiredCount = targetTier.requiredReferralCount;
  if (requiredCount <= 0) {
    return {
      eligible: true,
      requiredCount,
      qualifiedCount: 0,
      requiredTier: null,
    };
  }

  const requiredTier = targetTier.requiredReferralTierId
    ? await db.query.tiers.findFirst({
        where: eq(tiers.id, targetTier.requiredReferralTierId),
      })
    : null;

  const stats = await getReferralStats(userId);
  const qualifiedCount = stats.qualifiedAtOrAbove(
    targetTier.requiredReferralTierId,
    requiredTier?.sortOrder,
  );

  return {
    eligible: qualifiedCount >= requiredCount,
    requiredCount,
    qualifiedCount,
    requiredTier,
  };
}
