"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { questions, submissions, tasks, tiers } from "@/lib/db/schema";
import { PAID_TASK_COOLDOWN_HOURS } from "@/lib/constants";
import { gradeQuestion } from "@/lib/grading";
import { parseAmount } from "@/lib/utils";
import {
  canAnswerTaskToday,
  getUserTier,
  hasSubmittedTaskThisWeek,
  incrementDailyUsage,
} from "@/lib/quota";
import { applyLedgerEntry } from "@/lib/wallet/ledger";
import { getGlobalWithdrawalSettings } from "@/lib/withdrawals/settings";

export type TaskTrainingPayload = {
  aiSuggestedAnswer: string;
  aiSuggestedLabel: string;
  userMarkedAiCorrect: boolean;
  correctedAnswer?: string;
  correctedLabel?: string;
  finalAnswer: string;
  finalLabel: string;
};

export async function submitTaskAnswer(
  questionId: string,
  answer: string | TaskTrainingPayload,
) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const userId = session.user.id;
  const question = await db.query.questions.findFirst({
    where: eq(questions.id, questionId),
  });

  if (!question || question.isFreeTraining || !question.taskId) {
    return { error: "Question not found" };
  }

  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, question.taskId),
  });
  if (!task || task.status !== "active") {
    return { error: "Task is not active" };
  }
  if (await hasSubmittedTaskThisWeek(userId, task.id)) {
    return { error: "You already trained on this task this week" };
  }

  const quota = await canAnswerTaskToday(userId);
  if (!quota.allowed) {
    return { error: quota.reason ?? "Daily limit reached" };
  }

  const tier = await getUserTier(userId);
  if (!tier) return { error: "No tier assigned" };
  if (task.minTierId) {
    const minTier = await db.query.tiers.findFirst({
      where: eq(tiers.id, task.minTierId),
    });
    if (minTier && tier.sortOrder < minTier.sortOrder) {
      return { error: "Your tier is not eligible for this task" };
    }
  }

  const finalAnswer = typeof answer === "string" ? answer : answer.finalAnswer;
  const answerJson =
    typeof answer === "string"
      ? { mode: "paid_task", answer }
      : {
          mode: "paid_task",
          aiSuggestedAnswer: answer.aiSuggestedAnswer,
          aiSuggestedLabel: answer.aiSuggestedLabel,
          userMarkedAiCorrect: answer.userMarkedAiCorrect,
          correctedAnswer: answer.correctedAnswer ?? null,
          correctedLabel: answer.correctedLabel ?? null,
          finalAnswer: answer.finalAnswer,
          finalLabel: answer.finalLabel,
        };

  const isCorrect = gradeQuestion(question, finalAnswer);
  const settings = await getGlobalWithdrawalSettings();
  const wrongRewardPercent = Number(settings.wrongAnswerRewardPercent);
  const rewardUsdt = isCorrect
    ? tier.usdtPerQuestion
    : parseAmount((parseFloat(tier.usdtPerQuestion) * wrongRewardPercent) / 100);

  await db.insert(submissions).values({
    userId,
    questionId,
    answerJson,
    status: isCorrect ? "correct" : "incorrect",
    rewardUsdt,
  });

  if (parseFloat(rewardUsdt) > 0) {
    await applyLedgerEntry({
      userId,
      type: "task_reward",
      amount: rewardUsdt,
      metadata: {
        questionId,
        taskId: task.id,
        answerLeansWrong: !isCorrect,
        ...(isCorrect
          ? {}
          : { wrongRewardPercent: settings.wrongAnswerRewardPercent }),
      },
    });
  }
  await incrementDailyUsage(userId);

  const used = quota.used + 1;
  const nextAvailableAt =
    tier.dailyQuestionLimit > 1 && used < quota.limit
      ? new Date(
          Date.now() + PAID_TASK_COOLDOWN_HOURS * 60 * 60 * 1000,
        ).toISOString()
      : undefined;

  revalidatePath("/dashboard");
  return {
    success: true,
    correct: isCorrect,
    reward: rewardUsdt,
    wrongSideFeedback: !isCorrect,
    tier: {
      name: tier.name,
      rewardUsdt: tier.usdtPerQuestion,
      dailyQuestionLimit: tier.dailyQuestionLimit,
    },
    nextAvailableAt,
    quota: isCorrect
      ? { used, limit: quota.limit }
      : { used, limit: quota.limit },
  };
}
