import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { APP_NAME, TELEGRAM_SUPPORT_URL } from "@/lib/constants";
import {
  Brain,
  Image,
  ListChecks,
  MessageCircle,
  Smartphone,
  Sparkles,
} from "lucide-react";

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
          {APP_NAME} turns simple human judgment into better machine learning.
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

      <Card className="border-indigo-100 bg-indigo-50">
        <div className="flex gap-4">
          <MessageCircle className="h-8 w-8 shrink-0 text-indigo-600" />
          <div>
            <CardTitle className="text-base text-indigo-950">
              Telegram support
            </CardTitle>
            <CardDescription className="text-indigo-800">
              Need help with your account or training tasks? Contact support on
              Telegram.
            </CardDescription>
            <a
              href={TELEGRAM_SUPPORT_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex text-sm font-semibold text-indigo-700 hover:text-indigo-900"
            >
              Open Telegram support
            </a>
          </div>
        </div>
      </Card>

      <section className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-indigo-600">About Us</p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            AI training opportunities for people everywhere
          </h2>
        </div>
        <div className="space-y-4 text-sm leading-6 text-slate-600">
          <p>
            At {APP_NAME}, we connect people around the world with opportunities
            to help build the next generation of Artificial Intelligence.
          </p>
          <p>
            Leading AI companies require large amounts of human feedback and
            real-world knowledge to train and improve their AI models. AI
            systems learn from data, but they also need people to review
            information, evaluate responses, label content, test AI outputs, and
            provide feedback that helps models become more accurate, useful, and
            reliable.
          </p>
          <p>
            Our platform provides access to these AI training tasks through a
            simple and user-friendly experience. Participants complete tasks that
            contribute to the development of advanced AI technologies used by
            businesses, researchers, and millions of people worldwide.
          </p>
          <p>
            In return, our partners compensate us for the completed work,
            allowing us to reward our community members with real earnings for
            their contributions.
          </p>
          <p>
            Whether you are a student, professional, freelancer, or simply
            someone looking to earn additional income online, our platform
            offers an opportunity to participate in the rapidly growing AI
            industry while helping shape the future of intelligent technology.
          </p>
        </div>
        <div className="rounded-2xl bg-slate-50 p-4">
          <h3 className="font-bold text-slate-900">Our Mission</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            To create opportunities for people everywhere to contribute to the
            advancement of Artificial Intelligence while earning fair rewards for
            their time, knowledge, and effort.
          </p>
        </div>
        <div>
          <h3 className="font-bold text-slate-900">What You Can Expect</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            <li>Access to AI training and evaluation tasks</li>
            <li>Flexible work that can be completed online</li>
            <li>Transparent tracking of your contributions</li>
            <li>Real earnings based on completed tasks</li>
            <li>Opportunities to support cutting-edge AI development</li>
          </ul>
        </div>
        <p className="text-sm font-semibold text-slate-900">
          Together, we are helping train the AI systems of tomorrow—one task at
          a time.
        </p>
      </section>
    </div>
  );
}
