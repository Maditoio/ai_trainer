import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { questions, tasks } from "@/lib/db/schema";
import { hasSubmittedQuestion } from "@/lib/quota";
import { QuestionForm } from "@/components/tasks/question-form";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const { taskId } = await params;
  const session = await auth();
  if (!session?.user?.id) return null;

  const task = await db.query.tasks.findFirst({
    where: eq(tasks.id, taskId),
  });
  if (!task || task.status !== "active") notFound();

  const taskQuestions = await db.query.questions.findMany({
    where: eq(questions.taskId, taskId),
    orderBy: [asc(questions.sortOrder)],
  });

  const userId = session.user.id;
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
      </div>

      {completed ? (
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
