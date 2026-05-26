"use client";

import { useState } from "react";
import Image from "next/image";
import { submitTaskAnswer } from "@/lib/actions/submissions";
import type { TaskTrainingPayload } from "@/lib/actions/submissions";
import { submitFreeTrainingAnswer } from "@/lib/actions/free-training";
import type { Question } from "@/lib/db/schema";
import { getQuestionOptions, type McqOption } from "@/lib/grading";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

type Props = {
  question: Question;
  mode: "task" | "free-training";
};

export function QuestionForm({ question, mode }: Props) {
  const [answer, setAnswer] = useState("");
  const [aiVerdict, setAiVerdict] = useState<"correct" | "wrong" | null>(null);
  const [correctedOptionId, setCorrectedOptionId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [progressText, setProgressText] = useState<string | null>(null);
  const [progressStep, setProgressStep] = useState(0);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const options = getQuestionOptions(question);
  const aiSuggestion = mode === "task" ? getAiSuggestion(question.id, options) : null;
  const correctionOptions =
    aiSuggestion && options.length > 1
      ? options.filter((option) => option.id !== aiSuggestion.id)
      : options;
  const canTrainAi =
    !!aiSuggestion &&
    !!aiVerdict &&
    (aiVerdict === "correct" || !!correctedOptionId) &&
    !isPending;

  function optionToAnswer(option: McqOption) {
    return question.type === "multiple_choice" ? option.id : option.label;
  }

  async function runProgressSequence() {
    const steps = [
      "Training AI",
      "Synchronizing with partner database",
      "Updating models",
      "Training completed",
    ];

    for (const [index, step] of steps.entries()) {
      setProgressStep(index + 1);
      setProgressText(step);
      await new Promise((resolve) => setTimeout(resolve, 3750));
    }
  }

  async function onSubmit() {
    if (!answer) return;
    setIsPending(true);
    setMessage(null);
    setProgressText("Submitting answer");
    setProgressStep(0);

    try {
      const result =
        mode === "free-training"
          ? await submitFreeTrainingAnswer(question.id, answer)
          : await submitTaskAnswer(question.id, answer);

      if ("error" in result && result.error) {
        setMessage(result.error);
        setProgressText(null);
        return;
      }

      await runProgressSequence();

      if (result.correct) {
        const reward =
          "reward" in result && result.reward ? ` You earned ${result.reward} USDT.` : "";
        const next =
          "nextAvailableAt" in result && result.nextAvailableAt
            ? ` Next training unlocks at ${new Date(
                result.nextAvailableAt,
              ).toLocaleString()}.`
            : "";
        setMessage(
          mode === "free-training" && "completed" in result && result.completed
            ? "Correct! Free training complete — 1 USDT credited."
            : `Correct!${reward}${next}`,
        );
      } else {
        const next =
          "nextAvailableAt" in result && result.nextAvailableAt
            ? ` Next training unlocks at ${new Date(
                result.nextAvailableAt,
              ).toLocaleString()}.`
            : "";
        setMessage(`Incorrect. No reward for this answer.${next}`);
      }
      setAnswer("");
    } finally {
      setProgressText(null);
      setIsPending(false);
    }
  }

  async function onTrainAi() {
    if (!aiSuggestion || !aiVerdict) return;
    const correctedOption = correctedOptionId
      ? options.find((option) => option.id === correctedOptionId)
      : null;
    if (aiVerdict === "wrong" && !correctedOption) return;

    const finalOption = aiVerdict === "correct" ? aiSuggestion : correctedOption;
    if (!finalOption) return;

    const payload: TaskTrainingPayload = {
      aiSuggestedAnswer: optionToAnswer(aiSuggestion),
      aiSuggestedLabel: aiSuggestion.label,
      userMarkedAiCorrect: aiVerdict === "correct",
      correctedAnswer: correctedOption ? optionToAnswer(correctedOption) : undefined,
      correctedLabel: correctedOption?.label,
      finalAnswer: optionToAnswer(finalOption),
      finalLabel: finalOption.label,
    };

    setIsPending(true);
    setMessage(null);
    setProgressText("Training AI");
    setProgressStep(0);

    try {
      const resultPromise =
        mode === "free-training"
          ? submitFreeTrainingAnswer(question.id, payload.finalAnswer)
          : submitTaskAnswer(question.id, payload);
      await runProgressSequence();
      const result = await resultPromise;

      if ("error" in result && result.error) {
        setMessage(result.error);
        setProgressText(null);
        return;
      }

      const reward =
        result.correct && "reward" in result && result.reward
          ? `Reward: ${result.reward} USDT`
          : "";
      setCompletionMessage(
        result.correct
          ? `Training completed successfully.${reward ? ` ${reward}.` : ""}`
          : "Training completed.",
      );
      setAiVerdict(null);
      setCorrectedOptionId("");
    } finally {
      setProgressText(null);
      setIsPending(false);
    }
  }

  if (mode === "task" || mode === "free-training") {
    if (completionMessage) {
      return (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardTitle className="text-emerald-950">Training completed</CardTitle>
          <CardDescription className="mt-2 text-emerald-800">
            {completionMessage}
          </CardDescription>
        </Card>
      );
    }

    return (
      <Card>
        <CardTitle>Train AI</CardTitle>

        {question.imageUrl && (
          <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100 shadow-sm ring-1 ring-slate-200">
            <Image
              src={question.imageUrl}
              alt="Task"
              fill
              className="object-cover"
              unoptimized
            />
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/10 to-transparent" />
          </div>
        )}

        {aiSuggestion ? (
          <div className="mt-4 rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              AI says
            </p>
            <p className="mt-1 text-lg font-bold text-indigo-950">
              This object is: {aiSuggestion.label}
            </p>
          </div>
        ) : (
          <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-800">
            This task needs answer choices before it can be trained.
          </p>
        )}

        {aiSuggestion && (
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className={
                aiVerdict === "correct"
                  ? "border-emerald-500 bg-emerald-500 text-white hover:bg-emerald-600"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }
              disabled={isPending}
              onClick={() => {
                setAiVerdict("correct");
                setCorrectedOptionId("");
              }}
            >
              Correct
            </Button>
            <Button
              type="button"
              variant="outline"
              className={
                aiVerdict === "wrong"
                  ? "border-red-500 bg-red-500 text-white hover:bg-red-600"
                  : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
              }
              disabled={isPending}
              onClick={() => setAiVerdict("wrong")}
            >
              Wrong
            </Button>
          </div>
        )}

        {aiVerdict === "wrong" && (
          <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm font-bold text-red-900">Choose the correct answer</p>
            <div className="mt-3 grid gap-2">
              {correctionOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={isPending}
                  onClick={() => setCorrectedOptionId(opt.id)}
                  className={`min-h-11 rounded-xl border-2 px-4 py-2 text-left text-sm font-semibold transition ${
                    correctedOptionId === opt.id
                      ? "border-indigo-500 bg-white text-indigo-700 shadow-sm"
                      : "border-white bg-white/70 text-slate-700 hover:border-indigo-200 hover:bg-white"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {correctionOptions.length === 0 && (
              <p className="mt-2 text-sm text-red-800">
                This task has no alternative choices configured. Ask an admin to
                add answer options.
              </p>
            )}
          </div>
        )}

        {(aiVerdict === "correct" || correctedOptionId || isPending) && (
          <Button
            className="mt-4 w-full"
            onClick={onTrainAi}
            disabled={!canTrainAi}
          >
            {isPending ? "Training AI..." : "Train AI"}
          </Button>
        )}
        {progressText && (
          <ProgressMessage progressText={progressText} progressStep={progressStep} />
        )}
        {message && <p className="mt-3 text-sm font-medium text-slate-700">{message}</p>}
      </Card>
    );
  }

  return (
    <Card>
      <CardTitle>{question.prompt}</CardTitle>
      <CardDescription className="mt-1">
        {question.type === "image_label" ? "Identify the object" : "Multiple choice"}
      </CardDescription>

      {question.imageUrl && (
        <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-2xl bg-slate-100 shadow-sm ring-1 ring-slate-200">
          <Image
            src={question.imageUrl}
            alt="Task"
            fill
            className="object-cover"
            unoptimized
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/10 to-transparent" />
        </div>
      )}

      <div className="mt-4 space-y-2">
        {options.map((opt) => (
          <label
            key={opt.id}
            className="flex cursor-pointer items-center gap-2 rounded-md border border-foreground/10 p-3 hover:bg-foreground/5"
          >
            <input
              type="radio"
              name="answer"
              value={question.type === "multiple_choice" ? opt.id : opt.label}
              disabled={isPending}
              checked={
                question.type === "multiple_choice"
                  ? answer === opt.id
                  : answer === opt.label
              }
              onChange={() =>
                setAnswer(
                  question.type === "multiple_choice" ? opt.id : opt.label,
                )
              }
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>

      <Button className="mt-4 w-full" onClick={onSubmit} disabled={!answer || isPending}>
        {isPending ? "Submitting…" : "Submit answer"}
      </Button>
      {progressText && (
        <ProgressMessage progressText={progressText} progressStep={progressStep} />
      )}
      {message && <p className="mt-3 text-sm font-medium text-slate-700">{message}</p>}
    </Card>
  );
}

function getAiSuggestion(questionId: string, options: McqOption[]) {
  if (options.length === 0) return null;
  const hash = Array.from(questionId).reduce(
    (total, char) => total + char.charCodeAt(0),
    0,
  );
  return options[hash % options.length];
}

function ProgressMessage({
  progressText,
  progressStep,
}: {
  progressText: string;
  progressStep: number;
}) {
  const progressPercent = progressStep > 0 ? Math.min(progressStep * 25, 100) : 10;

  return (
    <div className="mt-4 rounded-xl bg-indigo-50 p-4 text-sm font-semibold text-indigo-800">
      <div className="flex items-center justify-between gap-3">
        <span>{progressText}…</span>
        <span className="text-xs text-indigo-500">
          {progressStep > 0 ? `${progressStep}/4` : "Starting"}
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-indigo-100">
        <div
          className="h-full rounded-full bg-indigo-500 transition-all duration-700"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
      <p className="mt-2 text-xs font-medium text-indigo-600">
        Please wait while ModelMind records and trains this AI feedback.
      </p>
    </div>
  );
}
