import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { deleteQuestion, deleteTask, upsertTask } from "@/lib/actions/admin";
import { db } from "@/lib/db";
import { questions, tasks } from "@/lib/db/schema";
import { getQuestionOptions } from "@/lib/grading";
import { AddQuestionForm } from "@/components/admin/add-question-form";
import { Steps } from "@/components/admin/steps";
import { TaskStatusBadge } from "@/components/admin/task-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export default async function AdminTaskDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ taskId: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { taskId } = await params;
  const { created } = await searchParams;

  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
  });
  if (!task) notFound();

  const taskQuestions = await db.query.questions.findMany({
    where: eq(questions.taskId, taskId),
    orderBy: [asc(questions.sortOrder)],
  });

  const nextSortOrder =
    taskQuestions.length > 0
      ? Math.max(...taskQuestions.map((q) => q.sortOrder)) + 1
      : 0;

  const step = taskQuestions.length === 0 ? 1 : task.status === "active" ? 2 : 1;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/tasks"
          className="text-sm text-foreground/60 hover:underline"
        >
          ← All tasks
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{task.title}</h1>
          <TaskStatusBadge status={task.status} />
        </div>
      </div>

      {created === "1" && (
        <Card className="border-green-500/30 bg-green-500/5">
          <CardDescription>
            Task created. Add at least one question below, then set status to{" "}
            <strong>Active</strong>.
          </CardDescription>
        </Card>
      )}

      {task.status !== "active" && taskQuestions.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardTitle className="text-amber-900">Users cannot see this yet</CardTitle>
          <CardDescription className="mt-1 text-amber-800">
            This task has questions, but it is still {task.status}. Set
            Visibility to Active and save settings to publish it on Vercel.
          </CardDescription>
        </Card>
      )}

      <Steps
        current={step}
        steps={[
          { label: "Create task", description: "Done" },
          { label: "Add questions", description: `${taskQuestions.length} added` },
          { label: "Go live", description: "Set Active" },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-2">
        <Card>
          <CardTitle>Task settings</CardTitle>
          <form
            action={async (formData) => {
              "use server";
              await upsertTask(formData, task.id);
            }}
            className="mt-4 space-y-4"
          >
            <div>
              <Label htmlFor="title">Task name</Label>
              <Input
                id="title"
                name="title"
                defaultValue={task.title}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                defaultValue={task.description ?? ""}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="type">Question type</Label>
              <Select
                id="type"
                name="type"
                defaultValue={task.type}
                className="mt-1"
              >
                <option value="multiple_choice">Quiz</option>
                <option value="image_label">Image labeling</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="status">Visibility</Label>
              <Select
                id="status"
                name="status"
                defaultValue={task.status}
                className="mt-1"
              >
                <option value="draft">Draft</option>
                <option value="active">Active — live for users</option>
                <option value="archived">Archived</option>
              </Select>
              {taskQuestions.length === 0 && (
                <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                  Add at least one question before going live.
                </p>
              )}
            </div>
            <Button type="submit">Save settings</Button>
          </form>
          <form
            action={async () => {
              "use server";
              await deleteTask(task.id);
            }}
            className="mt-6 border-t border-foreground/10 pt-4"
          >
            <Button type="submit" variant="destructive">
              Delete entire task
            </Button>
          </form>
        </Card>

        <Card>
          <CardTitle>Step 2 — Add a question</CardTitle>
          <CardDescription className="mt-1">
            {task.type === "image_label"
              ? "Upload an image and provide label choices."
              : "Write the question and multiple choice answers."}
          </CardDescription>
          <div className="mt-4">
            <AddQuestionForm
              taskId={task.id}
              taskType={task.type}
              nextSortOrder={nextSortOrder}
            />
          </div>
        </Card>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Questions ({taskQuestions.length})
        </h2>
        {taskQuestions.length === 0 ? (
          <p className="text-sm text-foreground/60">
            No questions yet — use the form above to add the first one.
          </p>
        ) : (
          <ul className="space-y-3">
            {taskQuestions.map((q, index) => {
              const options = getQuestionOptions(q);
              const correct = options.find((o) =>
                task.type === "multiple_choice"
                  ? o.id === q.correctAnswer
                  : o.label === q.correctAnswer ||
                    o.id === q.correctAnswer,
              );
              return (
                <li key={q.id}>
                  <Card>
                    <div className="flex justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium text-foreground/50">
                          Question {index + 1}
                        </p>
                        <p className="mt-1 font-medium">{q.prompt}</p>
                        <ul className="mt-2 space-y-1 text-sm text-foreground/70">
                          {options.map((o) => (
                            <li key={o.id}>
                              {o.label}
                              {correct?.id === o.id && (
                                <span className="ml-2 text-green-700 dark:text-green-400">
                                  ✓ correct
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <form
                        action={async () => {
                          "use server";
                          await deleteQuestion(q.id);
                        }}
                      >
                        <Button type="submit" variant="ghost" className="text-sm">
                          Remove
                        </Button>
                      </form>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
