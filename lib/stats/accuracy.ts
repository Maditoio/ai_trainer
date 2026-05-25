import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { submissions } from "@/lib/db/schema";

export async function getAccuracyStats(userId: string) {
  const rows = await db.query.submissions.findMany({
    where: eq(submissions.userId, userId),
  });

  const correct = rows.filter((row) => row.status === "correct").length;
  const wrong = rows.filter((row) => row.status === "incorrect").length;
  const total = correct + wrong;
  const accuracy = total === 0 ? 0 : Math.round((correct / total) * 100);

  return { correct, wrong, total, accuracy };
}

