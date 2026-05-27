import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { canAnswerTaskToday } from "@/lib/quota";
import { getWeeklyRandomTaskSuggestions } from "@/lib/tasks/suggestions";
import { formatUsdt } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

function formatRemaining(ms?: number) {
  if (!ms || ms <= 0) return "";
  const totalMinutes = Math.ceil(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export default async function TasksPage() {
  const session = await auth();
  const quota = session?.user?.id
    ? await canAnswerTaskToday(session.user.id)
    : null;
  const hasPaidTier = !!quota?.tierName;
  const activeTasks = session?.user?.id
    ? await getWeeklyRandomTaskSuggestions(session.user.id)
    : await db.query.tasks.findMany({
        where: eq(tasks.status, "active"),
      });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tasks</h1>
        {quota && (
          <p className="text-sm text-[var(--muted)]">
            {hasPaidTier
              ? `${quota.tierName}: ${formatUsdt(quota.rewardUsdt ?? "0")} USDT per question · ${quota.used}/${quota.limit} used today`
              : "No tier yet: upgrade to unlock paid training tasks"}
            {quota.cooldownRemainingMs
              ? ` · next task in ${formatRemaining(quota.cooldownRemainingMs)}`
              : ""}
          </p>
        )}
      </div>
      {quota && !hasPaidTier && (
        <Card className="border-amber-200 bg-amber-50">
          <CardTitle className="text-amber-950">Paid tasks are locked</CardTitle>
          <CardDescription className="mt-1 text-amber-800">
            Free training is still available. Choose a tier to start paid AI
            training tasks.
          </CardDescription>
          <Link href="/tier" className="mt-3 inline-block">
            <Button>View tiers</Button>
          </Link>
        </Card>
      )}
      {activeTasks.length === 0 ? (
        <Card>
          <CardTitle>No task available right now</CardTitle>
          <CardDescription className="mt-1">
            Waiting for an eligible weekly task recommendation. Tasks you train
            on can be recommended again next week.
          </CardDescription>
        </Card>
      ) : (
        <ul className="space-y-3">
          {activeTasks.map((task) => (
            <li key={task.id}>
              <Card className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{task.title}</CardTitle>
                  <CardDescription>{task.description}</CardDescription>
                  {task.category && (
                    <p className="mt-1 text-xs font-medium text-indigo-600">
                      {task.category}
                    </p>
                  )}
                  <Badge className="mt-2">
                    {quota?.allowed ? `+${formatUsdt(quota.rewardUsdt ?? "0")} USDT` : "Locked"}
                  </Badge>
                </div>
                <Link href={`/tasks/${task.id}`}>
                  <Button variant="outline">Start</Button>
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
