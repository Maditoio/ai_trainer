import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { dailyUsage, questions, submissions, tiers, users } from "@/lib/db/schema";
import { PAID_TASK_COOLDOWN_HOURS } from "@/lib/constants";
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
  return null;
}

export async function getDailyUsageCount(userId: string): Promise<number> {
  const today = todayUtc();
  const row = await db.query.dailyUsage.findFirst({
    where: and(eq(dailyUsage.userId, userId), eq(dailyUsage.usageDate, today)),
  });
  return row?.questionCount ?? 0;
}

export async function getLastPaidSubmission(userId: string) {
  const recent = await db.query.submissions.findMany({
    where: eq(submissions.userId, userId),
    orderBy: [desc(submissions.createdAt)],
    limit: 25,
  });

  for (const submission of recent) {
    const question = await db.query.questions.findFirst({
      where: eq(questions.id, submission.questionId),
    });
    if (question && !question.isFreeTraining) {
      return submission;
    }
  }

  return null;
}

export async function canAnswerTaskToday(userId: string): Promise<{
  allowed: boolean;
  used: number;
  limit: number;
  tierName?: string;
  rewardUsdt?: string;
  nextAvailableAt?: string;
  cooldownRemainingMs?: number;
  reason?: string;
}> {
  const tier = await getUserTier(userId);
  if (!tier) {
    return {
      allowed: false,
      used: 0,
      limit: 0,
      reason: "Upgrade to a tier before starting paid training tasks.",
    };
  }
  const used = await getDailyUsageCount(userId);
  const limit = tier.dailyQuestionLimit;
  const base = {
    used,
    limit,
    tierName: tier.name,
    rewardUsdt: tier.usdtPerQuestion,
  };

  if (used >= limit) {
    return {
      ...base,
      allowed: false,
      reason: `Daily limit reached (${limit} questions per day).`,
    };
  }

  if (limit > 1) {
    const lastPaidSubmission = await getLastPaidSubmission(userId);
    if (lastPaidSubmission?.createdAt) {
      const nextAvailable = new Date(
        new Date(lastPaidSubmission.createdAt).getTime() +
          PAID_TASK_COOLDOWN_HOURS * 60 * 60 * 1000,
      );

      const cooldownRemainingMs = nextAvailable.getTime() - Date.now();
      if (cooldownRemainingMs > 0) {
        return {
          ...base,
          allowed: false,
          nextAvailableAt: nextAvailable.toISOString(),
          cooldownRemainingMs,
          reason: `Your ${tier.name} package has a ${PAID_TASK_COOLDOWN_HOURS}-hour wait between training questions.`,
        };
      }
    }
  }

  return { ...base, allowed: true };
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
