import Link from "next/link";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { canAnswerTaskToday } from "@/lib/quota";
import { buildReferralLink, ensureReferralCode, getReferralStats } from "@/lib/referrals";
import { getAccuracyStats } from "@/lib/stats/accuracy";
import { getWeeklyRandomTaskSuggestions } from "@/lib/tasks/suggestions";
import { getWalletBalance } from "@/lib/wallet/ledger";
import { formatUsdt } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Coins, Sparkles, Wallet } from "lucide-react";
import { ReferralLinkCopy } from "@/components/referrals/referral-link-copy";

function formatRemaining(ms?: number) {
  if (!ms || ms <= 0) return "";
  const totalMinutes = Math.ceil(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const quota = await canAnswerTaskToday(userId);
  const balance = await getWalletBalance(userId);
  const activeTasks = await getWeeklyRandomTaskSuggestions(userId);
  const accuracy = await getAccuracyStats(userId);
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });
  const referralCode = await ensureReferralCode(userId, session.user.email ?? user?.email ?? "trainer");
  const referralLink = buildReferralLink(referralCode);
  const referralStats = await getReferralStats(userId);

  const canTrainToday = quota.allowed;
  const rewardUsdt = quota.rewardUsdt ?? "0";
  const tierName = quota.tierName ?? "No tier yet";
  const hasPaidTier = !!quota.tierName;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-indigo-600">Welcome back</p>
        <h1 className="text-2xl font-bold text-slate-900">
          {session.user.name?.split(" ")[0] ?? "Trainer"}
        </h1>
      </div>

      <Card className="gradient-bg border-0 text-white">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-indigo-100">Wallet</p>
            <p className="mt-1 text-3xl font-bold">{formatUsdt(balance)} USDT</p>
          </div>
          <Wallet className="h-8 w-8 text-indigo-200" />
        </div>
        <Link href="/wallet" className="mt-4 inline-block">
          <Button
            variant="outline"
            className="border-white/30 bg-white/10 text-white hover:bg-white/20"
          >
            Deposit or withdraw
          </Button>
        </Link>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-amber-50 border-amber-100">
          <Coins className="h-5 w-5 text-amber-600" />
          <p className="mt-2 text-lg font-bold text-amber-900">
            {formatUsdt(rewardUsdt)}
          </p>
          <CardDescription className="text-amber-800">
            USDT per question on {tierName}
          </CardDescription>
        </Card>
        <Card className={canTrainToday ? "bg-emerald-50 border-emerald-100" : "bg-slate-50"}>
          <Sparkles className={`h-5 w-5 ${canTrainToday ? "text-emerald-600" : "text-slate-400"}`} />
          <p className="mt-2 text-lg font-bold text-slate-900">
            {quota.used}/{quota.limit}
          </p>
          <CardDescription>
            {!hasPaidTier
              ? "Choose a tier to unlock paid tasks"
              : canTrainToday
              ? `Ready to train on ${tierName}`
              : quota.cooldownRemainingMs
                ? `Next task in ${formatRemaining(quota.cooldownRemainingMs)}`
                : "Come back tomorrow"}
          </CardDescription>
        </Card>
      </div>

      {!hasPaidTier && (
        <Card className="border-amber-200 bg-amber-50">
          <CardTitle className="text-amber-950">Choose a tier to train</CardTitle>
          <CardDescription className="mt-1 text-amber-800">
            Your account can complete free training now. Paid AI training tasks
            unlock after you upgrade to a package.
          </CardDescription>
          <Link href="/tier" className="mt-3 inline-block">
            <Button className="w-full sm:w-auto">View tiers</Button>
          </Link>
        </Card>
      )}

      <Card>
        <CardTitle>Accuracy score</CardTitle>
        <CardDescription className="mt-1">
          {accuracy.correct} correct · {accuracy.wrong} wrong
        </CardDescription>
        <div className="mt-3 flex items-end gap-3">
          <p className="text-4xl font-bold text-indigo-700">
            {accuracy.accuracy}%
          </p>
          <p className="pb-1 text-sm text-[var(--muted)]">
            based on {accuracy.total} answered question
            {accuracy.total === 1 ? "" : "s"}
          </p>
        </div>
      </Card>

      {!user?.freeTrainingCompletedAt && (
        <Card className="border-violet-200 bg-violet-50">
          <CardTitle className="text-violet-900">Daily training</CardTitle>
          <CardDescription className="text-violet-800">
            3 training days · 1 live task question per day · {formatUsdt(1)} USDT per day.
          </CardDescription>
          <Link href="/free-training" className="mt-3 inline-block">
            <Button className="w-full sm:w-auto">Start daily training</Button>
          </Link>
        </Card>
      )}

      <Card className="border-cyan-100 bg-cyan-50">
        <CardTitle className="text-cyan-950">Invite friends</CardTitle>
        <CardDescription className="mt-1 text-cyan-800">
          Share your referral link. Tier upgrades can require referrals who are
          already using specific packages.
        </CardDescription>
        <ReferralLinkCopy referralLink={referralLink} />
        <p className="mt-2 text-sm font-medium text-cyan-900">
          {referralStats.total} referral{referralStats.total === 1 ? "" : "s"} joined
        </p>
      </Card>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Train & earn</h2>
          <Link href="/tasks" className="text-sm font-medium text-indigo-600">
            See all
          </Link>
        </div>
        {activeTasks.length === 0 ? (
          <Card>
            <CardTitle>No task available right now</CardTitle>
            <CardDescription className="mt-1">
              Waiting for an eligible weekly task recommendation. Tasks you train
              on can be recommended again next week.
            </CardDescription>
          </Card>
        ) : (
          <ul className="space-y-3">
            {activeTasks.map((task) => (
              <li key={task.id}>
                <Link href={`/tasks/${task.id}`}>
                  <Card className="flex items-center gap-3 transition active:scale-[0.99]">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
                      <Brain className="h-6 w-6" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-900">{task.title}</p>
                      <p className="text-xs text-[var(--muted)] line-clamp-1">
                        {task.description ?? "Earn USDT for correct answers"}
                      </p>
                      {task.category && (
                        <p className="text-xs font-medium text-indigo-600">
                          {task.category}
                        </p>
                      )}
                    </div>
                    <Badge>
                      {canTrainToday ? `+${formatUsdt(rewardUsdt)} USDT` : "Locked"}
                    </Badge>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
