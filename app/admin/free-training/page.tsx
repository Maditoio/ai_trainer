import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { deleteQuestion } from "@/lib/actions/admin";
import { db } from "@/lib/db";
import { questions } from "@/lib/db/schema";
import { getQuestionOptions } from "@/lib/grading";
import { AddQuestionForm } from "@/components/admin/add-question-form";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function AdminFreeTrainingPage() {
  const freeQuestions = await db.query.questions.findMany({
    where: eq(questions.isFreeTraining, true),
    orderBy: [asc(questions.sortOrder)],
  });

  const nextSortOrder =
    freeQuestions.length > 0
      ? Math.max(...freeQuestions.map((q) => q.sortOrder)) + 1
      : 0;

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
          Onboarding quiz: users answer 3 questions (1 per day) and earn 1 USDT.
          Keep exactly 3 questions for the intended flow.
        </p>
      </div>

      <Card className="max-w-xl">
        <CardTitle>Add free training question</CardTitle>
        <CardDescription className="mt-1">
          Quiz only — no images. Users see these at /free-training.
        </CardDescription>
        <div className="mt-4">
          <AddQuestionForm
            isFreeTraining
            taskType="multiple_choice"
            nextSortOrder={nextSortOrder}
          />
        </div>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-semibold">
          Questions ({freeQuestions.length} / 3 recommended)
        </h2>
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
