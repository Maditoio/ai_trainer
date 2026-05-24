import { compareAnswers } from "@/lib/utils";
import type { Question } from "@/lib/db/schema";

export type McqOption = { id: string; label: string };

export function gradeQuestion(
  question: Question,
  answer: string,
): boolean {
  if (!question.correctAnswer) return false;

  if (question.type === "multiple_choice") {
    return question.correctAnswer === answer;
  }

  if (question.type === "image_label") {
    const options = (question.optionsJson as McqOption[] | null) ?? [];
    const byId = options.find((o) => o.id === question.correctAnswer);
    const expected = byId?.label ?? question.correctAnswer;
    return compareAnswers(expected ?? "", answer);
  }

  return false;
}

export function getQuestionOptions(question: Question): McqOption[] {
  const options = question.optionsJson as McqOption[] | null;
  if (options?.length) return options;
  if (question.type === "image_label" && question.correctAnswer) {
    return [{ id: "default", label: question.correctAnswer }];
  }
  return [];
}
