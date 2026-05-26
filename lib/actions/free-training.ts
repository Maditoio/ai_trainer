"use server";

import { and, asc, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  freeTrainingProgress,
  questions,
  submissions,
  tasks,
  users,
} from "@/lib/db/schema";
import {
  FREE_TRAINING_BONUS_USDT,
  FREE_TRAINING_TOTAL_QUESTIONS,
} from "@/lib/constants";
import { gradeQuestion } from "@/lib/grading";
import { todayUtc } from "@/lib/utils";
import { applyLedgerEntry } from "@/lib/wallet/ledger";

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

export async function submitFreeTrainingAnswer(questionId: string, answer: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };

  const userId = session.user.id;
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  if (user?.freeTrainingCompletedAt) {
    return { error: "Daily training already completed" };
  }

  const progress = await db.query.freeTrainingProgress.findFirst({
    where: eq(freeTrainingProgress.userId, userId),
  });
  if (!progress) {
    return { error: "Progress not found" };
  }
  if (progress.questionsAnswered >= FREE_TRAINING_TOTAL_QUESTIONS) {
    return { error: "Daily training already completed" };
  }

  const today = todayUtc();
  if (progress.lastAnsweredDate === today) {
    return { error: "You can only answer one free training question per day" };
  }

  const question = await db.query.questions.findFirst({
    where: eq(questions.id, questionId),
  });
  if (!question) return { error: "Question not found" };
  if (question.isFreeTraining || !question.taskId) {
    return { error: "Training question not found" };
  }
  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, question.taskId),
  });
  if (!task || task.status !== "active") {
    return { error: "Training task is not active" };
  }

  const isCorrect = gradeQuestion(question, answer);
  await db.insert(submissions).values({
    userId,
    questionId,
    answerJson: { mode: "free_training", answer },
    status: isCorrect ? "correct" : "incorrect",
    rewardUsdt: FREE_TRAINING_BONUS_USDT,
  });

  const newCount = progress.questionsAnswered + 1;
  const completed = newCount >= FREE_TRAINING_TOTAL_QUESTIONS;

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
  }

  await applyLedgerEntry({
    userId,
    type: "free_training_bonus",
    amount: FREE_TRAINING_BONUS_USDT,
    metadata: { reason: "free_training_daily", questionId },
  });

  revalidatePath("/free-training");
  revalidatePath("/dashboard");
  revalidatePath("/wallet");
  return {
    success: true,
    correct: isCorrect,
    completed,
    questionsAnswered: newCount,
    reward: FREE_TRAINING_BONUS_USDT,
    total: FREE_TRAINING_TOTAL_QUESTIONS,
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
  const activeTasks = await db.query.tasks.findMany({
    where: eq(tasks.status, "active"),
    orderBy: [asc(tasks.createdAt)],
  });
  const activeTaskIds = activeTasks.map((task) => task.id);
  const trainingQuestions =
    activeTaskIds.length > 0
      ? await db.query.questions.findMany({
          where: and(
            inArray(questions.taskId, activeTaskIds),
            eq(questions.isFreeTraining, false),
          ),
          orderBy: [asc(questions.sortOrder)],
        })
      : [];

  const nextQuestion = shuffle(trainingQuestions)[0] ?? null;

  const today = todayUtc();
  const completed =
    !!user?.freeTrainingCompletedAt ||
    (progress?.questionsAnswered ?? 0) >= FREE_TRAINING_TOTAL_QUESTIONS;
  const canAnswerToday = !!progress && !completed && progress.lastAnsweredDate !== today;

  return {
    completed,
    progress,
    questions: trainingQuestions,
    answeredIds: [],
    canAnswerToday,
    nextQuestion,
    total: FREE_TRAINING_TOTAL_QUESTIONS,
  };
}
