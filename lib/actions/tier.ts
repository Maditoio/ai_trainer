"use server";

import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tiers, users } from "@/lib/db/schema";
import { getUserTier } from "@/lib/quota";
import { getTierReferralEligibility } from "@/lib/referrals";
import { applyLedgerEntry, getWalletBalance } from "@/lib/wallet/ledger";

export async function getTiersForUpgrade() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const currentTier = await getUserTier(session.user.id);
  const allTiers = await db.query.tiers.findMany({
    orderBy: [asc(tiers.sortOrder)],
  });
  const balance = await getWalletBalance(session.user.id);
  const referralEligibility = await Promise.all(
    allTiers.map(async (tier) => ({
      tierId: tier.id,
      ...(await getTierReferralEligibility(session.user.id, tier.id)),
    })),
  );

  return { currentTier, allTiers, balance, referralEligibility };
}

export async function upgradeTier(tierId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;
  const targetTier = await db.query.tiers.findFirst({
    where: eq(tiers.id, tierId),
  });
  if (!targetTier) throw new Error("Tier not found");
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (!user) throw new Error("User not found");

  const referralEligibility = await getTierReferralEligibility(
    userId,
    targetTier.id,
  );
  if (!referralEligibility.eligible) {
    throw new Error(
      `You need ${referralEligibility.requiredCount} qualified referrals to upgrade to ${targetTier.name}. You currently have ${referralEligibility.qualifiedCount}.`,
    );
  }

  const currentTier = await getUserTier(userId);
  if (currentTier?.id === targetTier.id) {
    throw new Error("Already on this tier");
  }

  if (
    currentTier &&
    targetTier.sortOrder <= currentTier.sortOrder &&
    parseFloat(targetTier.upgradePriceUsdt) > 0
  ) {
    throw new Error("Can only upgrade to a higher tier");
  }

  const price = parseFloat(targetTier.upgradePriceUsdt);
  const shouldPayReferralCommission =
    price > 0 && !!user.referredByUserId && !user.referralCommissionPaidAt;
  const referralCommission = shouldPayReferralCommission
    ? Number((price * 0.03).toFixed(8))
    : 0;

  if (price > 0) {
    const balance = parseFloat(await getWalletBalance(userId));
    if (balance < price) {
      throw new Error("Insufficient balance");
    }

    await applyLedgerEntry({
      userId,
      type: "tier_upgrade",
      amount: (-price).toFixed(8),
      metadata: { tierId: targetTier.id, tierName: targetTier.name },
    });
  }

  if (shouldPayReferralCommission && user.referredByUserId && referralCommission > 0) {
    await applyLedgerEntry({
      userId: user.referredByUserId,
      type: "referral_commission",
      amount: referralCommission.toFixed(8),
      metadata: {
        referredUserId: user.id,
        tierId: targetTier.id,
        tierName: targetTier.name,
        upgradeAmountUsdt: targetTier.upgradePriceUsdt,
        commissionRate: "0.03",
      },
    });
  }

  await db
    .update(users)
    .set({
      currentTierId: targetTier.id,
      referralCommissionPaidAt: shouldPayReferralCommission
        ? new Date()
        : user.referralCommissionPaidAt,
    })
    .where(eq(users.id, userId));

  revalidatePath("/tier");
  revalidatePath("/dashboard");
  revalidatePath("/wallet");
}

export async function upsertTier(
  formData: FormData,
  tierId?: string,
): Promise<void> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const name = String(formData.get("name") ?? "");
  const dailyQuestionLimit = Number(formData.get("dailyQuestionLimit"));
  const usdtPerQuestion = String(formData.get("usdtPerQuestion") ?? "0");
  const upgradePriceUsdt = String(formData.get("upgradePriceUsdt") ?? "0");
  const sortOrder = Number(formData.get("sortOrder") ?? 0);
  const requiredReferralCount = Number(
    formData.get("requiredReferralCount") ?? 0,
  );
  const requiredReferralTierId =
    String(formData.get("requiredReferralTierId") ?? "") || null;
  const isDefault = formData.get("isDefault") === "on";

  if (!name || Number.isNaN(dailyQuestionLimit)) {
    throw new Error("Invalid tier data");
  }

  if (requiredReferralTierId) {
    const requiredTier = await db.query.tiers.findFirst({
      where: eq(tiers.id, requiredReferralTierId),
    });
    if (!requiredTier) {
      throw new Error("Selected referral minimum tier does not exist");
    }
  }

  if (isDefault) {
    await db.update(tiers).set({ isDefault: false });
  }

  const values = {
    name,
    dailyQuestionLimit,
    usdtPerQuestion,
    upgradePriceUsdt,
    sortOrder,
    requiredReferralCount: Number.isNaN(requiredReferralCount)
      ? 0
      : requiredReferralCount,
    requiredReferralTierId,
    isDefault,
  };

  if (tierId) {
    await db.update(tiers).set(values).where(eq(tiers.id, tierId));
  } else {
    await db.insert(tiers).values(values);
  }

  revalidatePath("/admin/tiers");
}

export async function deleteTier(tierId: string): Promise<void> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    throw new Error("Unauthorized");
  }

  const tier = await db.query.tiers.findFirst({
    where: eq(tiers.id, tierId),
  });
  if (tier?.isDefault) {
    throw new Error("Cannot delete default tier");
  }

  await db.delete(tiers).where(eq(tiers.id, tierId));
  revalidatePath("/admin/tiers");
}
