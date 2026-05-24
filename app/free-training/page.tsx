import { getFreeTrainingState } from "@/lib/actions/free-training";
import { QuestionForm } from "@/components/tasks/question-form";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function FreeTrainingPage() {
  const state = await getFreeTrainingState();
  if (!state) return null;

  if (state.completed) {
    return (
      <Card>
        <CardTitle>Free training complete</CardTitle>
        <CardDescription className="mt-2">
          You earned your 1 USDT bonus. Explore paid tasks from the dashboard.
        </CardDescription>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Free training</h1>
        <p className="text-foreground/60">
          Progress: {state.progress?.questionsAnswered ?? 0} / 3 — 1 question per
          day. Complete all 3 to earn 1 USDT.
        </p>
      </div>

      {!state.canAnswerToday ? (
        <Card>
          <CardTitle>Come back tomorrow</CardTitle>
          <CardDescription className="mt-2">
            You can answer one free training question per day (UTC).
          </CardDescription>
        </Card>
      ) : state.nextQuestion ? (
        <QuestionForm question={state.nextQuestion} mode="free-training" />
      ) : (
        <Card>
          <CardDescription>All questions answered. Awaiting completion bonus.</CardDescription>
        </Card>
      )}
    </div>
  );
}
