"use server";

import { and, asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  freeTrainingProgress,
  questions,
  submissions,
  users,
} from "@/lib/db/schema";
import { gradeQuestion } from "@/lib/grading";
import { hasSubmittedQuestion } from "@/lib/quota";
import { todayUtc } from "@/lib/utils";
import { applyLedgerEntry } from "@/lib/wallet/ledger";

const FREE_TRAINING_TOTAL = 3;
const FREE_TRAINING_BONUS = "1.00000000";

export async function submitFreeTrainingAnswer(questionId: string, answer: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const userId = session.user.id;
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (user?.freeTrainingCompletedAt) {
    return { error: "Free training already completed" };
  }

  const progress = await db.query.freeTrainingProgress.findFirst({
    where: eq(freeTrainingProgress.userId, userId),
  });
  if (!progress) {
    return { error: "Progress not found" };
  }

  if (progress.questionsAnswered >= FREE_TRAINING_TOTAL) {
    return { error: "Free training already completed" };
  }

  const today = todayUtc();
  if (progress.lastAnsweredDate === today) {
    return { error: "You can only answer one free training question per day" };
  }

  const question = await db.query.questions.findFirst({
    where: and(
      eq(questions.id, questionId),
      eq(questions.isFreeTraining, true),
    ),
  });
  if (!question) return { error: "Question not found" };

  if (await hasSubmittedQuestion(userId, questionId)) {
    return { error: "Already submitted" };
  }

  const isCorrect = gradeQuestion(question, answer);
  await db.insert(submissions).values({
    userId,
    questionId,
    answerJson: { answer },
    status: isCorrect ? "correct" : "incorrect",
    rewardUsdt: "0",
  });

  if (!isCorrect) {
    revalidatePath("/free-training");
    return { success: true, correct: false };
  }

  const newCount = progress.questionsAnswered + 1;
  const completed = newCount >= FREE_TRAINING_TOTAL;

  await db
    .update(freeTrainingProgress)
    .set({
      questionsAnswered: newCount,
      lastAnsweredDate: today,
    })
    .where(eq(freeTrainingProgress.userId, userId));

  if (completed) {
    await db
      .update(users)
      .set({ freeTrainingCompletedAt: new Date() })
      .where(eq(users.id, userId));

    await applyLedgerEntry({
      userId,
      type: "free_training_bonus",
      amount: FREE_TRAINING_BONUS,
      metadata: { reason: "free_training_complete" },
    });
  }

  revalidatePath("/free-training");
  revalidatePath("/dashboard");
  revalidatePath("/wallet");
  return {
    success: true,
    correct: true,
    completed,
    questionsAnswered: newCount,
    total: FREE_TRAINING_TOTAL,
  };
}

export async function getFreeTrainingState() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userId = session.user.id;
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  const progress = await db.query.freeTrainingProgress.findFirst({
    where: eq(freeTrainingProgress.userId, userId),
  });
  const freeQuestions = await db.query.questions.findMany({
    where: eq(questions.isFreeTraining, true),
    orderBy: [asc(questions.sortOrder)],
  });

  const answeredIds = new Set<string>();
  for (const q of freeQuestions) {
    if (await hasSubmittedQuestion(userId, q.id)) {
      answeredIds.add(q.id);
    }
  }

  const today = todayUtc();
  const canAnswerToday =
    !user?.freeTrainingCompletedAt &&
    progress &&
    progress.questionsAnswered < FREE_TRAINING_TOTAL &&
    progress.lastAnsweredDate !== today;

  const nextQuestion = freeQuestions.find((q) => !answeredIds.has(q.id));

  return {
    completed: !!user?.freeTrainingCompletedAt,
    progress,
    questions: freeQuestions,
    answeredIds: [...answeredIds],
    canAnswerToday,
    nextQuestion,
  };
}
