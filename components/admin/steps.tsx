import { cn } from "@/lib/utils";

type Step = { label: string; description?: string };

export function Steps({
  steps,
  current,
}: {
  steps: Step[];
  current: number;
}) {
  return (
    <ol className="flex flex-col gap-4 sm:flex-row sm:gap-0">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li
            key={step.label}
            className={cn(
              "flex flex-1 items-start gap-3 sm:flex-col sm:items-center sm:text-center",
              i < steps.length - 1 && "sm:pb-0",
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                done && "bg-foreground text-background",
                active && !done && "ring-2 ring-foreground bg-foreground/10",
                !done && !active && "bg-foreground/10 text-foreground/50",
              )}
            >
              {done ? "✓" : i + 1}
            </span>
            <div className="min-w-0 sm:px-2">
              <p
                className={cn(
                  "text-sm font-medium",
                  active ? "text-foreground" : "text-foreground/60",
                )}
              >
                {step.label}
              </p>
              {step.description && (
                <p className="text-xs text-foreground/50">{step.description}</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
