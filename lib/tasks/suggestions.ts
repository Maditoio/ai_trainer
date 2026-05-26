import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tasks, tiers } from "@/lib/db/schema";
import { getUserTier, hasSubmittedTaskThisWeek } from "@/lib/quota";

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

  const freshTasks = [];
  for (const task of activeTasks) {
    const minTier = task.minTierId ? tierById.get(task.minTierId) : null;
    if (minTier && userTier.sortOrder < minTier.sortOrder) {
      continue;
    }

    if (!(await hasSubmittedTaskThisWeek(userId, task.id))) {
      freshTasks.push(task);
    }
  }

  return shuffle(freshTasks).slice(0, 1);
}

