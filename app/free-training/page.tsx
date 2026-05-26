import { getFreeTrainingState } from "@/lib/actions/free-training";
import { QuestionForm } from "@/components/tasks/question-form";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function FreeTrainingPage() {
  const state = await getFreeTrainingState();
  if (!state) return null;

  if (state.completed) {
    return (
      <Card>
        <CardTitle>Training complete</CardTitle>
        <CardDescription className="mt-2">
          You completed all 3 daily training sessions.
        </CardDescription>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Daily training</h1>
        <p className="text-foreground/60">
          Progress: {state.progress?.questionsAnswered ?? 0} / {state.total} days.
          Train on live task questions and earn 1 USDT once per day.
        </p>
      </div>

      {!state.canAnswerToday ? (
        <Card>
          <CardTitle>Come back tomorrow</CardTitle>
          <CardDescription className="mt-2">
            You can earn from one daily training session per day (UTC).
          </CardDescription>
        </Card>
      ) : state.nextQuestion ? (
        <QuestionForm question={state.nextQuestion} mode="free-training" />
      ) : (
        <Card>
          <CardTitle>No training question available</CardTitle>
          <CardDescription className="mt-2">
            Waiting for active task questions to train on.
          </CardDescription>
        </Card>
      )}
    </div>
  );
}
