import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  draft: "bg-amber-500/15 text-amber-800 dark:text-amber-200",
  active: "bg-green-500/15 text-green-800 dark:text-green-200",
  archived: "bg-foreground/10",
};

export function TaskStatusBadge({ status }: { status: string }) {
  return (
    <Badge className={cn(styles[status] ?? styles.draft)}>
      {status === "draft" && "Draft — hidden from users"}
      {status === "active" && "Live — users can see this"}
      {status === "archived" && "Archived"}
      {!["draft", "active", "archived"].includes(status) && status}
    </Badge>
  );
}
