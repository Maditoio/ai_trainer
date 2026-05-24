"use client";

import { useState, useTransition } from "react";
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
  const [isPending, startTransition] = useTransition();
  const options = getQuestionOptions(question);

  function onSubmit() {
    if (!answer) return;
    startTransition(async () => {
      const result =
        mode === "free-training"
          ? await submitFreeTrainingAnswer(question.id, answer)
          : await submitTaskAnswer(question.id, answer);

      if ("error" in result && result.error) {
        setMessage(result.error);
        return;
      }
      if (result.correct) {
        setMessage(
          mode === "free-training" && "completed" in result && result.completed
            ? "Correct! Free training complete — 1 USDT credited."
            : "Correct!",
        );
      } else {
        setMessage("Incorrect. Try again tomorrow or the next question.");
      }
      setAnswer("");
    });
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

      <Button className="mt-4" onClick={onSubmit} disabled={!answer || isPending}>
        {isPending ? "Submitting…" : "Submit answer"}
      </Button>
      {message && <p className="mt-2 text-sm">{message}</p>}
    </Card>
  );
}
