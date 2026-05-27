import { getFreeTrainingState } from "@/lib/actions/free-training";
import { QuestionForm } from "@/components/tasks/question-form";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatUsdt } from "@/lib/utils";
import { Award, Brain, CalendarCheck, Sparkles } from "lucide-react";

export default async function FreeTrainingPage() {
  const state = await getFreeTrainingState();
  if (!state) return null;
  const answered = state.progress?.questionsAnswered ?? 0;
  const total = state.total;
  const remaining = Math.max(total - answered, 0);

  if (state.completed) {
    return (
      <div className="space-y-5">
        <Card className="overflow-hidden border-emerald-200 bg-gradient-to-br from-emerald-50 via-cyan-50 to-white text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
            <Award className="h-9 w-9" />
          </div>
          <CardTitle className="mt-4 text-2xl text-emerald-950">
            Training complete
          </CardTitle>
          <CardDescription className="mx-auto mt-2 max-w-xs text-emerald-800">
            You completed all {total} daily training sessions.
          </CardDescription>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-600 via-cyan-500 to-emerald-400 p-5 text-white shadow-xl shadow-indigo-500/20">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-cyan-100">Premium training</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              Daily AI training
            </h1>
            <p className="mt-2 max-w-sm text-sm text-white/85">
              Train on live task questions. Complete one session per day for
              {` ${formatUsdt(1)} USDT`} daily training rewards.
            </p>
          </div>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white backdrop-blur">
            <Brain className="h-7 w-7" />
          </span>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
            <p className="text-xl font-bold">{answered}/{total}</p>
            <p className="text-xs text-white/80">Days done</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
            <p className="text-xl font-bold">{remaining}</p>
            <p className="text-xs text-white/80">Remaining</p>
          </div>
          <div className="rounded-2xl bg-white/15 p-3 backdrop-blur">
            <p className="text-xl font-bold">{formatUsdt(1)}</p>
            <p className="text-xs text-white/80">USDT/day</p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-cyan-100 bg-cyan-50">
          <Sparkles className="h-5 w-5 text-cyan-600" />
          <CardTitle className="mt-2 text-base text-cyan-950">
            Live questions
          </CardTitle>
          <CardDescription className="text-cyan-800">
            Pulled from real active tasks.
          </CardDescription>
        </Card>
        <Card className="border-amber-100 bg-amber-50">
          <CalendarCheck className="h-5 w-5 text-amber-600" />
          <CardTitle className="mt-2 text-base text-amber-950">
            One per day
          </CardTitle>
          <CardDescription className="text-amber-800">
            {remaining} training day{remaining === 1 ? "" : "s"} left.
          </CardDescription>
        </Card>
      </div>

      {!state.canAnswerToday ? (
        <Card className="border-indigo-100 bg-indigo-50">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-indigo-950">Come back tomorrow</CardTitle>
            <Badge className="bg-indigo-100 text-indigo-700">Locked today</Badge>
          </div>
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
