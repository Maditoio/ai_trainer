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
  const [isPending, setIsPending] = useState(false);
  const options = getQuestionOptions(question);
  const aiSuggestion = mode === "task" ? getAiSuggestion(question.id, options) : null;

  function optionToAnswer(option: McqOption) {
    return question.type === "multiple_choice" ? option.id : option.label;
  }

  async function runProgressSequence() {
    const steps = [
      "Analyzing answer",
      "Training AI",
      "Updating AI database",
      "Training completed",
    ];

    for (const step of steps) {
      setProgressText(step);
      await new Promise((resolve) => setTimeout(resolve, 7500));
    }
  }

  async function onSubmit() {
    if (!answer) return;
    setIsPending(true);
    setMessage(null);
    setProgressText("Submitting answer");

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
    setProgressText("Submitting training signal");

    try {
      const result = await submitTaskAnswer(question.id, payload);

      if ("error" in result && result.error) {
        setMessage(result.error);
        setProgressText(null);
        return;
      }

      await runProgressSequence();

      const reward =
        result.correct && "reward" in result && result.reward
          ? ` You earned ${result.reward} USDT.`
          : "";
      const next =
        "nextAvailableAt" in result && result.nextAvailableAt
          ? ` Next training unlocks at ${new Date(
              result.nextAvailableAt,
            ).toLocaleString()}.`
          : "";
      setMessage(
        result.correct
          ? `AI trained successfully.${reward}${next}`
          : `Training recorded. The selected correction did not match the expected answer.${next}`,
      );
      setAiVerdict(null);
      setCorrectedOptionId("");
    } finally {
      setProgressText(null);
      setIsPending(false);
    }
  }

  if (mode === "task") {
    return (
      <Card>
        <CardTitle>{question.prompt}</CardTitle>
        <CardDescription className="mt-1">
          Review the AI suggestion and train the model with your feedback.
        </CardDescription>

        {question.imageUrl && (
          <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-md">
            <Image
              src={question.imageUrl}
              alt="Task"
              fill
              className="object-contain"
              unoptimized
            />
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
              variant={aiVerdict === "correct" ? "default" : "outline"}
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
              variant={aiVerdict === "wrong" ? "destructive" : "outline"}
              disabled={isPending}
              onClick={() => setAiVerdict("wrong")}
            >
              Wrong
            </Button>
          </div>
        )}

        {aiVerdict === "wrong" && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-semibold text-slate-700">
              Select the correct answer
            </p>
            {options.map((opt) => (
              <label
                key={opt.id}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-foreground/10 p-3 hover:bg-foreground/5"
              >
                <input
                  type="radio"
                  name="correctedAnswer"
                  value={opt.id}
                  disabled={isPending}
                  checked={correctedOptionId === opt.id}
                  onChange={() => setCorrectedOptionId(opt.id)}
                />
                <span>{opt.label}</span>
              </label>
            ))}
          </div>
        )}

        <Button
          className="mt-4 w-full"
          onClick={onTrainAi}
          disabled={
            !aiSuggestion ||
            !aiVerdict ||
            (aiVerdict === "wrong" && !correctedOptionId) ||
            isPending
          }
        >
          {isPending ? "Training AI..." : "Train AI"}
        </Button>
        {progressText && (
          <ProgressMessage progressText={progressText} />
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
        <div className="relative mt-4 aspect-video w-full overflow-hidden rounded-md">
          <Image
            src={question.imageUrl}
            alt="Task"
            fill
            className="object-contain"
            unoptimized
          />
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
        <ProgressMessage progressText={progressText} />
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

function ProgressMessage({ progressText }: { progressText: string }) {
  return (
    <div className="mt-4 rounded-xl bg-indigo-50 p-4 text-sm font-semibold text-indigo-800">
      {progressText}…
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-indigo-100">
        <div className="h-full animate-pulse rounded-full bg-indigo-500" />
      </div>
    </div>
  );
}
