import Link from "next/link";
import { CreateTaskForm } from "@/components/admin/create-task-form";
import { Steps } from "@/components/admin/steps";

export default function NewTaskPage() {
  return (
    <div className="mx-auto max-w-lg space-y-8">
      <div>
        <Link
          href="/admin/tasks"
          className="text-sm text-foreground/60 hover:underline"
        >
          ← Back to tasks
        </Link>
        <h1 className="mt-2 text-2xl font-bold">New task</h1>
      </div>

      <Steps
        current={0}
        steps={[
          { label: "Create task", description: "Name and type" },
          { label: "Add questions", description: "One or more" },
          { label: "Go live", description: "Set to Active" },
        ]}
      />

      <CreateTaskForm />
    </div>
  );
}
