import { and, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db";
import { questions, submissions, tasks, tiers } from "@/lib/db/schema";
import { getUserTier } from "@/lib/quota";

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
  const userTier = await getUserTier(userId);
  if (!userTier) return [];

  const activeTasks = await db.query.tasks.findMany({
    where: eq(tasks.status, "active"),
  });
  const allTiers = await db.query.tiers.findMany();
  const tierById = new Map(allTiers.map((tier) => [tier.id, tier]));
  const weekStart = startOfWeekUtc();

  const freshTasks = [];
  for (const task of activeTasks) {
    const minTier = task.minTierId ? tierById.get(task.minTierId) : null;
    if (minTier && userTier.sortOrder < minTier.sortOrder) {
      continue;
    }

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

  return shuffle(freshTasks).slice(0, userTier.dailyQuestionLimit);
}

