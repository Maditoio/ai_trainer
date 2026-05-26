import { compareAnswers } from "@/lib/utils";
import type { Question } from "@/lib/db/schema";

export type McqOption = { id: string; label: string };

function normalizeOptions(rawOptions: unknown): McqOption[] {
  if (!Array.isArray(rawOptions)) return [];

  return rawOptions
    .map((option, index) => {
      if (typeof option === "string") {
        return { id: String.fromCharCode(97 + index), label: option };
      }

      if (option && typeof option === "object") {
        const record = option as Record<string, unknown>;
        const id = String(record.id ?? record.value ?? String.fromCharCode(97 + index));
        const label = String(record.label ?? record.text ?? record.value ?? "").trim();
        if (label) return { id, label };
      }

      return null;
    })
    .filter((option): option is McqOption => !!option);
}

export function gradeQuestion(
  question: Question,
  answer: string,
): boolean {
  if (!question.correctAnswer) return false;

  if (question.type === "multiple_choice") {
    return question.correctAnswer === answer;
  }

  if (question.type === "image_label") {
    const options = normalizeOptions(question.optionsJson);
    const byId = options.find((o) => o.id === question.correctAnswer);
    const expected = byId?.label ?? question.correctAnswer;
    return compareAnswers(expected ?? "", answer);
  }

  return false;
}

export function getQuestionOptions(question: Question): McqOption[] {
  const options = normalizeOptions(question.optionsJson);
  if (options?.length) return options;
  if (question.type === "image_label" && question.correctAnswer) {
    return [{ id: "default", label: question.correctAnswer }];
  }
  return [];
}
