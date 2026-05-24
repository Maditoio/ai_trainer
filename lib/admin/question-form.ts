import type { McqOption } from "@/lib/grading";

const OPTION_IDS = ["a", "b", "c", "d", "e", "f"] as const;

export function parseOptionsFromFormData(formData: FormData): McqOption[] {
  const options: McqOption[] = [];
  for (const id of OPTION_IDS) {
    const label = String(formData.get(`option_${id}`) ?? "").trim();
    if (label) options.push({ id, label });
  }
  return options;
}

export function resolveCorrectAnswer(
  type: "multiple_choice" | "image_label",
  options: McqOption[],
  correctOptionId: string,
): string {
  const selected = options.find((o) => o.id === correctOptionId);
  if (!selected) throw new Error("Select which answer is correct");
  if (type === "multiple_choice") return selected.id;
  return selected.label;
}
