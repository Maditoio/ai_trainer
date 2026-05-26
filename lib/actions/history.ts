"use server";

import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ledgerEntries, questions, submissions, tasks } from "@/lib/db/schema";

export async function getTaskEarningsHistory() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const rows = await db.query.submissions.findMany({
    where: eq(submissions.userId, session.user.id),
    orderBy: [desc(submissions.createdAt)],
    limit: 100,
  });
  const rewardEntries = await db.query.ledgerEntries.findMany({
    where: eq(ledgerEntries.userId, session.user.id),
    orderBy: [desc(ledgerEntries.createdAt)],
    limit: 200,
  });
  const rewardsByQuestionId = new Map<string, string>();
  const unmatchedFreeTrainingRewards = rewardEntries.filter(
    (entry) => entry.type === "free_training_bonus",
  );
  for (const entry of rewardEntries) {
    const metadata = entry.metadata as { questionId?: string } | null;
    if (
      (entry.type === "task_reward" || entry.type === "free_training_bonus") &&
      metadata?.questionId
    ) {
      rewardsByQuestionId.set(metadata.questionId, entry.amount);
    }
  }

  const enriched = [];
  for (const row of rows) {
    const question = await db.query.questions.findFirst({
      where: eq(questions.id, row.questionId),
    });
    let taskTitle = question?.isFreeTraining
      ? "Free training"
      : "Training task";
    if (question?.taskId) {
      const task = await db.query.tasks.findFirst({
        where: eq(tasks.id, question.taskId),
      });
      if (task) taskTitle = task.title;
    }
    const ledgerReward = rewardsByQuestionId.get(row.questionId);
    const fallbackFreeTrainingReward =
      question?.isFreeTraining && row.status === "correct" && row.rewardUsdt === "0.00000000"
        ? unmatchedFreeTrainingRewards.shift()?.amount
        : undefined;
    enriched.push({
      ...row,
      rewardUsdt: ledgerReward ?? fallbackFreeTrainingReward ?? row.rewardUsdt,
      taskTitle,
      questionPrompt: question?.prompt ?? "",
      isFreeTraining: question?.isFreeTraining ?? false,
    });
  }
  return enriched;
}
