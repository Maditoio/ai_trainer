import { describe, expect, it } from "vitest";
import { gradeQuestion } from "@/lib/grading";
import type { Question } from "@/lib/db/schema";
import { compareAnswers, parseAmount } from "@/lib/utils";

const baseQuestion = {
  id: "1",
  taskId: null,
  sortOrder: 0,
  type: "multiple_choice" as const,
  prompt: "Test",
  imageUrl: null,
  optionsJson: [
    { id: "a", label: "Yes" },
    { id: "b", label: "No" },
  ],
  correctAnswer: "a",
  isFreeTraining: false,
  createdAt: new Date(),
};

describe("grading", () => {
  it("grades multiple choice correctly", () => {
    expect(gradeQuestion(baseQuestion as Question, "a")).toBe(true);
    expect(gradeQuestion(baseQuestion as Question, "b")).toBe(false);
  });

  it("grades image label against correct option only", () => {
    const q = {
      ...baseQuestion,
      type: "image_label" as const,
      correctAnswer: "Cat",
      optionsJson: [
        { id: "a", label: "Cat" },
        { id: "b", label: "Dog" },
      ],
    };
    expect(gradeQuestion(q as Question, "cat")).toBe(true);
    expect(gradeQuestion(q as Question, "dog")).toBe(false);
  });
});

describe("utils", () => {
  it("parses amounts to 8 decimals", () => {
    expect(parseAmount(1)).toBe("1.00000000");
  });

  it("compares answers case-insensitively", () => {
    expect(compareAnswers("Hello", "hello")).toBe(true);
  });
});
