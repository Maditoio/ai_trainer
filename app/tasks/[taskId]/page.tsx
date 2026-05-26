import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { questions, tasks } from "@/lib/db/schema";
import { canAnswerTaskToday, hasSubmittedQuestion } from "@/lib/quota";
import { QuestionForm } from "@/components/tasks/question-form";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

function formatRemaining(ms?: number) {
  if (!ms || ms <= 0) return "";
  const totalMinutes = Math.ceil(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
  });
  if (!task || task.status !== "active") notFound();

  const taskQuestions = await db.query.questions.findMany({
    where: eq(questions.taskId, taskId),
    orderBy: [asc(questions.sortOrder)],
  });

  const userId = session.user.id;
  const quota = await canAnswerTaskToday(userId);
  let nextQuestion = null;
  for (const q of taskQuestions) {
    if (!(await hasSubmittedQuestion(userId, q.id))) {
      nextQuestion = q;
      break;
    }
  }

  const completed = taskQuestions.length > 0 && !nextQuestion;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{task.title}</h1>
        <p className="text-foreground/60">{task.description}</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          {quota.tierName
            ? `${quota.tierName}: ${quota.rewardUsdt} USDT per correct answer · ${quota.used}/${quota.limit} used today`
            : "No tier yet: upgrade to unlock paid training tasks"}
        </p>
      </div>

      {!quota.allowed ? (
        <Card>
          <CardTitle>Training locked for now</CardTitle>
          <CardDescription className="mt-2">
            {quota.reason}
            {quota.cooldownRemainingMs
              ? ` Next task in ${formatRemaining(quota.cooldownRemainingMs)}.`
              : ""}
          </CardDescription>
          {!quota.tierName && (
            <Link
              href="/tier"
              className="mt-3 inline-flex text-sm font-semibold text-indigo-600"
            >
              View tiers
            </Link>
          )}
        </Card>
      ) : completed ? (
        <Card>
          <CardTitle>Task complete</CardTitle>
          <CardDescription className="mt-2">
            You have answered all questions in this task.
          </CardDescription>
        </Card>
      ) : nextQuestion ? (
        <QuestionForm question={nextQuestion} mode="task" />
      ) : (
        <Card>
          <CardDescription>No questions in this task yet.</CardDescription>
        </Card>
      )}
    </div>
  );
}
