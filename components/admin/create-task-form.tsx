"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createTask } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

export function CreateTaskForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    try {
      await createTask(formData);
    } catch (err) {
      if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err;
      setError(err instanceof Error ? err.message : "Could not create task");
      setPending(false);
    }
  }

  return (
    <Card>
      <CardTitle>Step 1 — Create a task</CardTitle>
      <CardDescription className="mt-1">
        A task is a group of questions (quiz or image labeling). You will add
        questions on the next screen.
      </CardDescription>
      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <Label htmlFor="title">Task name</Label>
          <Input
            id="title"
            name="title"
            required
            placeholder="e.g. Street signs — batch 1"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="description">Description (optional)</Label>
          <Input
            id="description"
            name="description"
            placeholder="Short note for admins or users"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            name="category"
            placeholder="Animals, plants, vehicles..."
            className="mt-1"
          />
          <p className="mt-1 text-xs text-foreground/60">
            Categories help randomize user task suggestions.
          </p>
        </div>
        <div>
          <Label htmlFor="type">Question type for this task</Label>
          <Select id="type" name="type" defaultValue="multiple_choice" className="mt-1">
            <option value="multiple_choice">Quiz (multiple choice)</option>
            <option value="image_label">Image labeling (user picks a label)</option>
          </Select>
          <p className="mt-1 text-xs text-foreground/60">
            All questions in this task use the same type.
          </p>
        </div>
        <div>
          <Label htmlFor="status">Visibility</Label>
          <Select id="status" name="status" defaultValue="draft" className="mt-1">
            <option value="draft">Draft — only you see it</option>
            <option value="active">Active — users can answer and earn</option>
            <option value="archived">Archived</option>
          </Select>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Creating…" : "Create task & add questions →"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/tasks")}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}
