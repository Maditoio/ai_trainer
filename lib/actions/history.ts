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
  const rewardsByQuestionId = new Map<string, typeof rewardEntries>();
  const unmatchedFreeTrainingRewards = rewardEntries.filter(
    (entry) => entry.type === "free_training_bonus",
  );
  for (const entry of rewardEntries) {
    const metadata = entry.metadata as { questionId?: string } | null;
    if (
      (entry.type === "task_reward" || entry.type === "free_training_bonus") &&
      metadata?.questionId
    ) {
      const entries = rewardsByQuestionId.get(metadata.questionId) ?? [];
      entries.push(entry);
      rewardsByQuestionId.set(metadata.questionId, entries);
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
    const answerJson = row.answerJson as { mode?: string } | null;
    const isDailyTraining =
      answerJson?.mode === "free_training" || question?.isFreeTraining === true;
    const ledgerReward = rewardsByQuestionId.get(row.questionId)?.shift()?.amount;
    const fallbackFreeTrainingReward =
      isDailyTraining && parseFloat(row.rewardUsdt) === 0
        ? unmatchedFreeTrainingRewards.shift()?.amount
        : undefined;
    enriched.push({
      ...row,
      rewardUsdt: ledgerReward ?? fallbackFreeTrainingReward ?? row.rewardUsdt,
      taskTitle: isDailyTraining ? "Daily training" : taskTitle,
      questionPrompt: question?.prompt ?? "",
      isFreeTraining: isDailyTraining,
    });
  }
  return enriched;
}
