import { getTaskEarningsHistory } from "@/lib/actions/history";
import { TRAINING_REWARD_USDT } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";

export default async function HistoryPage() {
  const history = await getTaskEarningsHistory();

  const totalEarned = history
    .filter((h) => h.status === "correct")
    .reduce((sum, h) => sum + parseFloat(h.rewardUsdt), 0)
    .toFixed(2);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Training history</h1>
        <p className="text-sm text-[var(--muted)]">
          {TRAINING_REWARD_USDT} USDT per correct answer · 1 question / day
        </p>
      </div>

      <Card className="bg-indigo-50 border-indigo-100">
        <CardDescription>Total earned from training</CardDescription>
        <p className="text-3xl font-bold text-indigo-900">{totalEarned} USDT</p>
      </Card>

      <ul className="space-y-3">
        {history.map((item) => (
          <li key={item.id}>
            <Card className="flex gap-3">
              {item.status === "correct" ? (
                <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-500" />
              ) : (
                <XCircle className="h-6 w-6 shrink-0 text-slate-300" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{item.taskTitle}</p>
                <p className="mt-0.5 line-clamp-2 text-sm text-[var(--muted)]">
                  {item.questionPrompt}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {item.createdAt?.toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                {item.status === "correct" ? (
                  <p className="font-bold text-emerald-600">+{item.rewardUsdt}</p>
                ) : (
                  <Badge className="bg-slate-100 text-slate-600">No reward</Badge>
                )}
              </div>
            </Card>
          </li>
        ))}
        {history.length === 0 && (
          <Card>
            <CardTitle>No training yet</CardTitle>
            <CardDescription className="mt-1">
              Complete a task to see your earnings here.
            </CardDescription>
          </Card>
        )}
      </ul>
    </div>
  );
}
