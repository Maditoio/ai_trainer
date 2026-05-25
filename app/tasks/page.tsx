import Link from "next/link";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { canAnswerTaskToday } from "@/lib/quota";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function TasksPage() {
  const session = await auth();
  const quota = session?.user?.id
    ? await canAnswerTaskToday(session.user.id)
    : null;
  const activeTasks = await db.query.tasks.findMany({
    where: eq(tasks.status, "active"),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tasks</h1>
        {quota && (
          <p className="mt-1 text-sm text-[var(--muted)]">
            {quota.tierName}: {quota.rewardUsdt} USDT per question ·{" "}
            {quota.used}/{quota.limit} used today
            {quota.nextAvailableAt
              ? ` · next unlock ${new Date(quota.nextAvailableAt).toLocaleString()}`
              : ""}
          </p>
        )}
      </div>
      {activeTasks.length === 0 ? (
        <Card>
          <CardTitle>No active training tasks are live yet</CardTitle>
          <CardDescription className="mt-1">
            An admin must create a task, add questions, and set it to Active
            before it appears here.
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
                  <Badge className="mt-2">
                    {quota?.allowed ? `+${quota.rewardUsdt} USDT` : "Locked"}
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
