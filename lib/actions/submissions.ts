"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { questions, submissions, tasks } from "@/lib/db/schema";
import { TRAINING_REWARD_USDT } from "@/lib/constants";
import { gradeQuestion } from "@/lib/grading";
import {
  canAnswerTaskToday,
  getUserTier,
  hasSubmittedQuestion,
  incrementDailyUsage,
} from "@/lib/quota";
import { applyLedgerEntry } from "@/lib/wallet/ledger";

export async function submitTaskAnswer(questionId: string, answer: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const userId = session.user.id;
  const question = await db.query.questions.findFirst({
    where: eq(questions.id, questionId),
  });

  if (!question || question.isFreeTraining || !question.taskId) {
    return { error: "Question not found" };
  }

  if (await hasSubmittedQuestion(userId, questionId)) {
    return { error: "Already submitted" };
  }

  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, question.taskId),
  });
  if (!task || task.status !== "active") {
    return { error: "Task is not active" };
  }

  const quota = await canAnswerTaskToday(userId);
  if (!quota.allowed) {
    return { error: quota.reason ?? "Daily limit reached" };
  }

  const tier = await getUserTier(userId);
  if (!tier) return { error: "No tier assigned" };

  const isCorrect = gradeQuestion(question, answer);
  const rewardUsdt = isCorrect ? TRAINING_REWARD_USDT : "0";

  await db.insert(submissions).values({
    userId,
    questionId,
    answerJson: { answer },
    status: isCorrect ? "correct" : "incorrect",
    rewardUsdt,
  });

  if (isCorrect) {
    await applyLedgerEntry({
      userId,
      type: "task_reward",
      amount: rewardUsdt,
      metadata: { questionId, taskId: task.id },
    });
    await incrementDailyUsage(userId);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/tasks/${task.id}`);
  return {
    success: true,
    correct: isCorrect,
    reward: rewardUsdt,
    quota: isCorrect
      ? { used: quota.used + 1, limit: quota.limit }
      : { used: quota.used, limit: quota.limit },
  };
}
