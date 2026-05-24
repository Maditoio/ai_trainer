"use server";

import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { questions, submissions, tasks } from "@/lib/db/schema";

export async function getTaskEarningsHistory() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const rows = await db.query.submissions.findMany({
    where: eq(submissions.userId, session.user.id),
    orderBy: [desc(submissions.createdAt)],
    limit: 100,
  });

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
    enriched.push({
      ...row,
      taskTitle,
      questionPrompt: question?.prompt ?? "",
      isFreeTraining: question?.isFreeTraining ?? false,
    });
  }
  return enriched;
}
