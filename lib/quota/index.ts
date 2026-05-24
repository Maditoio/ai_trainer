import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { dailyUsage, submissions, tiers, users } from "@/lib/db/schema";
import { TRAINING_QUESTIONS_PER_DAY } from "@/lib/constants";
import { todayUtc } from "@/lib/utils";

export async function getUserTier(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (user?.currentTierId) {
    return db.query.tiers.findFirst({
      where: eq(tiers.id, user.currentTierId),
    });
  }
  return db.query.tiers.findFirst({
    where: eq(tiers.isDefault, true),
  });
}

export async function getDailyUsageCount(userId: string): Promise<number> {
  const today = todayUtc();
  const row = await db.query.dailyUsage.findFirst({
    where: and(eq(dailyUsage.userId, userId), eq(dailyUsage.usageDate, today)),
  });
  return row?.questionCount ?? 0;
}

export async function canAnswerTaskToday(userId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  reason?: string;
}> {
  const tier = await getUserTier(userId);
  if (!tier) {
    return {
      allowed: false,
      used: 0,
      limit: 0,
      reason: "No tier assigned. Please contact support.",
    };
  }
  const used = await getDailyUsageCount(userId);
  const limit = Math.min(tier.dailyQuestionLimit, TRAINING_QUESTIONS_PER_DAY);
  if (used >= limit) {
    return {
      allowed: false,
      used,
      limit,
      reason: `Daily limit reached (${limit} questions per day).`,
    };
  }
  return { allowed: true, used, limit };
}

export async function incrementDailyUsage(userId: string) {
  const today = todayUtc();
  await db
    .insert(dailyUsage)
    .values({ userId, usageDate: today, questionCount: 1 })
    .onConflictDoUpdate({
      target: [dailyUsage.userId, dailyUsage.usageDate],
      set: { questionCount: sql`${dailyUsage.questionCount} + 1` },
    });
}

export async function hasSubmittedQuestion(
  userId: string,
  questionId: string,
): Promise<boolean> {
  const existing = await db.query.submissions.findFirst({
    where: and(
      eq(submissions.userId, userId),
      eq(submissions.questionId, questionId),
    ),
  });
  return !!existing;
}
