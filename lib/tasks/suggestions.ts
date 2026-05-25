import { and, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { questions, submissions, tasks } from "@/lib/db/schema";

function startOfWeekUtc() {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = day === 0 ? 6 : day - 1;
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  start.setUTCDate(start.getUTCDate() - diff);
  return start;
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

export async function getWeeklyRandomTaskSuggestions(userId: string) {
  const activeTasks = await db.query.tasks.findMany({
    where: eq(tasks.status, "active"),
  });
  const weekStart = startOfWeekUtc();

  const freshTasks = [];
  for (const task of activeTasks) {
    const taskQuestions = await db.query.questions.findMany({
      where: eq(questions.taskId, task.id),
    });

    let answeredThisWeek = false;
    for (const question of taskQuestions) {
      const recentSubmission = await db.query.submissions.findFirst({
        where: and(
          eq(submissions.userId, userId),
          eq(submissions.questionId, question.id),
          gte(submissions.createdAt, weekStart),
        ),
      });
      if (recentSubmission) {
        answeredThisWeek = true;
        break;
      }
    }

    if (!answeredThisWeek) {
      freshTasks.push(task);
    }
  }

  return shuffle(freshTasks);
}

