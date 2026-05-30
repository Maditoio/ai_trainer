import { getTaskEarningsHistory } from "@/lib/actions/history";
import { auth } from "@/lib/auth";
import { getUserTier } from "@/lib/quota";
import { getAccuracyStats } from "@/lib/stats/accuracy";
import { formatAppDateTime, formatUsdt } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle } from "lucide-react";

export default async function HistoryPage() {
  const session = await auth();
  const history = await getTaskEarningsHistory();
  const tier = session?.user?.id ? await getUserTier(session.user.id) : null;
  const accuracy = session?.user?.id
    ? await getAccuracyStats(session.user.id)
    : { correct: 0, wrong: 0, total: 0, accuracy: 0 };

  const totalEarned = history.reduce(
    (sum, h) => sum + parseFloat(h.rewardUsdt),
    0,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Training history</h1>
        <p className="text-sm text-[var(--muted)]">
          {tier
            ? `${tier.name}: ${formatUsdt(tier.usdtPerQuestion)} USDT per correct answer · ${tier.dailyQuestionLimit} per day`
            : "Actual earned amounts are shown below"}
        </p>
      </div>

      <Card className="bg-indigo-50 border-indigo-100">
        <CardDescription>Total earned from training</CardDescription>
        <p className="text-3xl font-bold text-indigo-900">{formatUsdt(totalEarned)} USDT</p>
      </Card>

      <Card>
        <CardTitle>Accuracy score</CardTitle>
        <CardDescription className="mt-1">
          {accuracy.correct} correct · {accuracy.wrong} wrong
        </CardDescription>
        <p className="mt-2 text-3xl font-bold text-indigo-700">
          {accuracy.accuracy}%
        </p>
      </Card>

      <ul className="space-y-3">
        {history.map((item) => (
          <li key={item.id}>
            <Card className="flex gap-3">
              {item.status === "correct" ? (
                <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-500" />
              ) : (
                <XCircle className="h-6 w-6 shrink-0 text-rose-400" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{item.taskTitle}</p>
                <p className="mt-0.5 line-clamp-2 text-sm text-[var(--muted)]">
                  {item.questionPrompt}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">
                  {formatAppDateTime(item.createdAt)}
                </p>
              </div>
              <div className="text-right">
                {parseFloat(item.rewardUsdt) > 0 ? (
                  <p className="font-bold text-emerald-600">+{formatUsdt(item.rewardUsdt)} USDT</p>
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
