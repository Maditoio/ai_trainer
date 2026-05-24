"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { uploadTaskImage, upsertQuestion } from "@/lib/actions/admin";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEFAULT_OPTIONS = [
  { id: "a", label: "" },
  { id: "b", label: "" },
  { id: "c", label: "" },
  { id: "d", label: "" },
];

type Props = {
  taskId?: string;
  taskType: "multiple_choice" | "image_label";
  isFreeTraining?: boolean;
  nextSortOrder?: number;
};

export function AddQuestionForm({
  taskId,
  taskType,
  isFreeTraining = false,
  nextSortOrder = 0,
}: Props) {
  const router = useRouter();
  const [correctOption, setCorrectOption] = useState("a");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const type = isFreeTraining ? "multiple_choice" : taskType;
  const showImage = type === "image_label";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setMessage(null);
    const formData = new FormData(e.currentTarget);
    formData.set("correctOption", correctOption);
    if (taskId) formData.set("taskId", taskId);
    if (isFreeTraining) formData.set("isFreeTraining", "on");
    formData.set("type", type);
    formData.set("sortOrder", String(nextSortOrder));

    try {
      await upsertQuestion(formData);
      setMessage("Question added.");
      e.currentTarget.reset();
      setCorrectOption("a");
      router.refresh();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Failed to add question");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {isFreeTraining && (
        <input type="hidden" name="isFreeTraining" value="on" />
      )}
      {taskId && <input type="hidden" name="taskId" value={taskId} />}

      <div>
        <Label htmlFor="prompt">Question</Label>
        <Input
          id="prompt"
          name="prompt"
          required
          placeholder={
            showImage
              ? "e.g. What object is shown in this image?"
              : "e.g. Which animal builds dams?"
          }
          className="mt-1"
        />
      </div>

      {showImage && (
        <ImageUploadField uploadAction={uploadTaskImage} required />
      )}

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Answer choices</legend>
        <p className="text-xs text-foreground/60">
          Fill in at least two options, then mark the correct one.
        </p>
        {DEFAULT_OPTIONS.map((opt) => (
          <div key={opt.id} className="flex items-center gap-3">
            <input
              type="radio"
              name="correctOptionUi"
              id={`correct_${opt.id}`}
              checked={correctOption === opt.id}
              onChange={() => setCorrectOption(opt.id)}
              className="shrink-0"
            />
            <Label htmlFor={`option_${opt.id}`} className="sr-only">
              Option {opt.id.toUpperCase()}
            </Label>
            <Input
              id={`option_${opt.id}`}
              name={`option_${opt.id}`}
              placeholder={`Choice ${opt.id.toUpperCase()}`}
              className="flex-1"
            />
          </div>
        ))}
      </fieldset>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Add question"}
      </Button>
      {message && (
        <p
          className={`text-sm ${message.includes("added") ? "text-green-700 dark:text-green-400" : "text-red-600"}`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
