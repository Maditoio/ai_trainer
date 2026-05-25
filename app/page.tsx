import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Brain, Image, ListChecks, Smartphone, Sparkles } from "lucide-react";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="space-y-8 pb-8">
      <section className="pt-4 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl gradient-bg text-white shadow-lg shadow-indigo-500/30">
          <Brain className="h-9 w-9" />
        </span>
        <h1 className="mt-5 text-3xl font-bold text-slate-900">
          Help AI learn.<br />
          <span className="gradient-text">One task at a time.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xs text-[var(--muted)]">
          AI Trainer turns simple human judgment into better machine learning.
          Review images, answer questions, and help build cleaner training data.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link href="/register">
            <Button className="w-full">Create account</Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" className="w-full">
              Sign in
            </Button>
          </Link>
          {session?.user && (
            <Link href="/dashboard">
              <Button variant="ghost" className="w-full">
                Continue to dashboard
              </Button>
            </Link>
          )}
        </div>
      </section>

      <div className="grid gap-3">
        <Card className="flex gap-4">
          <Image className="h-8 w-8 shrink-0 text-indigo-500" />
          <div>
            <CardTitle className="text-base">Image understanding</CardTitle>
            <CardDescription>
              Identify objects, labels, and patterns so AI models learn from
              accurate examples.
            </CardDescription>
          </div>
        </Card>
        <Card className="flex gap-4">
          <ListChecks className="h-8 w-8 shrink-0 text-emerald-500" />
          <div>
            <CardTitle className="text-base">Question answering</CardTitle>
            <CardDescription>
              Complete quick multiple-choice tasks that help validate AI
              reasoning and classification.
            </CardDescription>
          </div>
        </Card>
        <Card className="flex gap-4">
          <Smartphone className="h-8 w-8 shrink-0 text-cyan-500" />
          <div>
            <CardTitle className="text-base">Built for mobile</CardTitle>
            <CardDescription>
              Short, focused tasks with clear progress, designed for quick
              training sessions on your phone.
            </CardDescription>
          </div>
        </Card>
        <Card className="flex gap-4">
          <Sparkles className="h-8 w-8 shrink-0 text-amber-500" />
          <div>
            <CardTitle className="text-base">Why it matters</CardTitle>
            <CardDescription>
              Better human feedback creates cleaner datasets and more useful AI
              systems.
            </CardDescription>
          </div>
        </Card>
      </div>
    </div>
  );
}
