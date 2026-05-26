import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { deleteQuestion } from "@/lib/actions/admin";
import { db } from "@/lib/db";
import { questions } from "@/lib/db/schema";
import { getQuestionOptions } from "@/lib/grading";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function AdminFreeTrainingPage() {
  const freeQuestions = await db.query.questions.findMany({
    where: eq(questions.isFreeTraining, true),
    orderBy: [asc(questions.sortOrder)],
  });

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/tasks"
          className="text-sm text-foreground/60 hover:underline"
        >
          ← Tasks
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Free training</h1>
        <p className="mt-1 max-w-xl text-sm text-foreground/60">
          Daily training now uses questions from active user tasks. Users can
          complete 3 training days, with 1 question and 1 USDT per day.
        </p>
      </div>

      <Card className="max-w-xl">
        <CardTitle>Training source</CardTitle>
        <CardDescription className="mt-1">
          Add and activate tasks from the Tasks admin area. Daily training pulls
          random questions from those same active tasks.
        </CardDescription>
        <Link href="/admin/tasks" className="mt-4 inline-block">
          <Button>Manage tasks</Button>
        </Link>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Legacy training questions ({freeQuestions.length})
        </h2>
        <p className="mb-3 text-sm text-foreground/60">
          These older standalone questions are no longer shown to users.
        </p>
        <ul className="space-y-3">
          {freeQuestions.map((q, index) => {
            const options = getQuestionOptions(q);
            const correct = options.find((o) => o.id === q.correctAnswer);
            return (
              <li key={q.id}>
                <Card className="flex justify-between gap-4">
                  <div>
                    <p className="text-xs text-foreground/50">#{index + 1}</p>
                    <p className="font-medium">{q.prompt}</p>
                    <p className="mt-1 text-sm text-foreground/60">
                      Correct: {correct?.label ?? q.correctAnswer}
                    </p>
                  </div>
                  <form
                    action={async () => {
                      "use server";
                      await deleteQuestion(q.id);
                    }}
                  >
                    <Button type="submit" variant="ghost">
                      Remove
                    </Button>
                  </form>
                </Card>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
