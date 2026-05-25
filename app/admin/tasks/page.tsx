import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { questions, tasks } from "@/lib/db/schema";
import { TaskStatusBadge } from "@/components/admin/task-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function AdminTasksPage() {
  const allTasks = await db.query.tasks.findMany({
    orderBy: [desc(tasks.createdAt)],
  });

  const questionCounts = await db
    .select({
      taskId: questions.taskId,
      count: sql<number>`count(*)::int`,
    })
    .from(questions)
    .where(eq(questions.isFreeTraining, false))
    .groupBy(questions.taskId);

  const countByTask = Object.fromEntries(
    questionCounts.map((r) => [r.taskId, r.count]),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="mt-1 max-w-xl text-sm text-foreground/60">
            Create a task, add questions, then set it to <strong>Active</strong> so
            users can earn USDT.
          </p>
        </div>
        <Link href="/admin/tasks/new">
          <Button>+ New task</Button>
        </Link>
      </div>

      <Card className="border-foreground/15 bg-foreground/[0.03]">
        <CardTitle className="text-base">How it works</CardTitle>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-foreground/70">
          <li>
            <Link href="/admin/tasks/new" className="underline">
              Create a task
            </Link>{" "}
            (name + quiz or image type)
          </li>
          <li>Add one or more questions on the task page</li>
          <li>Set status to <strong>Active</strong> when ready</li>
          <li>Users see it under Tasks and earn per correct answer</li>
        </ol>
        <p className="mt-3 text-sm">
          <Link href="/admin/free-training" className="underline">
            Free training questions
          </Link>{" "}
          are separate (onboarding, 3 questions, 1 USDT bonus).
        </p>
      </Card>

      {allTasks.length === 0 ? (
        <Card>
          <CardTitle>No tasks yet</CardTitle>
          <CardDescription className="mt-2">
            Start by creating your first task.
          </CardDescription>
          <Link href="/admin/tasks/new" className="mt-4 inline-block">
            <Button>Create first task</Button>
          </Link>
        </Card>
      ) : (
        <ul className="space-y-3">
          {allTasks.map((task) => {
            const count = countByTask[task.id] ?? 0;
            return (
              <li key={task.id}>
                <Card className="flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle className="text-base">{task.title}</CardTitle>
                      <TaskStatusBadge status={task.status} />
                    </div>
                    <CardDescription className="mt-1">
                      {task.type === "image_label" ? "Image labeling" : "Quiz"} ·{" "}
                      {task.category ? `${task.category} · ` : ""}
                      {count} question{count === 1 ? "" : "s"}
                      {task.description ? ` · ${task.description}` : ""}
                    </CardDescription>
                    {task.status === "draft" && count > 0 && (
                      <p className="mt-2 text-sm font-medium text-amber-700">
                        Ready to publish: open this task and set Visibility to
                        Active.
                      </p>
                    )}
                    {task.status === "draft" && count === 0 && (
                      <p className="mt-2 text-sm font-medium text-slate-500">
                        Add at least one question, then activate it for users.
                      </p>
                    )}
                  </div>
                  <Link href={`/admin/tasks/${task.id}`}>
                    <Button variant="outline">Manage →</Button>
                  </Link>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
