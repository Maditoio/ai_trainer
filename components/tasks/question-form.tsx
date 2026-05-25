"use client";

import { useState } from "react";
import Image from "next/image";
import { submitTaskAnswer } from "@/lib/actions/submissions";
import { submitFreeTrainingAnswer } from "@/lib/actions/free-training";
import type { Question } from "@/lib/db/schema";
import { getQuestionOptions } from "@/lib/grading";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

type Props = {
  question: Question;
  mode: "task" | "free-training";
};

export function QuestionForm({ question, mode }: Props) {
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [progressText, setProgressText] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const options = getQuestionOptions(question);

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
        <div className="mt-4 rounded-xl bg-indigo-50 p-4 text-sm font-semibold text-indigo-800">
          {progressText}…
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-indigo-100">
            <div className="h-full animate-pulse rounded-full bg-indigo-500" />
          </div>
        </div>
      )}
      {message && <p className="mt-3 text-sm font-medium text-slate-700">{message}</p>}
    </Card>
  );
}
