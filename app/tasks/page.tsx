import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";

export default async function TasksPage() {
  const activeTasks = await db.query.tasks.findMany({
    where: eq(tasks.status, "active"),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Tasks</h1>
      {activeTasks.length === 0 ? (
        <p className="text-foreground/60">No active tasks available.</p>
      ) : (
        <ul className="space-y-3">
          {activeTasks.map((task) => (
            <li key={task.id}>
              <Card className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{task.title}</CardTitle>
                  <CardDescription>{task.description}</CardDescription>
                  <Badge className="mt-2">{task.type}</Badge>
                </div>
                <Link href={`/tasks/${task.id}`}>
                  <Button variant="outline">Start</Button>
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
