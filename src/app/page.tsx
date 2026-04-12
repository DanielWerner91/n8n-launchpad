import Link from "next/link";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  Rocket,
  Target,
  Calendar,
  BarChart3,
  ArrowRight,
  Zap,
  Users,
  FolderOpen,
} from "lucide-react";

const FEATURES = [
  {
    icon: Target,
    title: "AI Strategy Generation",
    description:
      "Get a comprehensive go-to-market strategy with positioning, ICP analysis, and channel scoring powered by Claude.",
  },
  {
    icon: Calendar,
    title: "Week-by-Week Timeline",
    description:
      "Auto-generated task timeline with daily actions, priority levels, and progress tracking across every launch phase.",
  },
  {
    icon: Users,
    title: "Community Playbooks",
    description:
      "Detailed playbooks for Reddit, Product Hunt, Indie Hackers, LinkedIn, and 20+ directories with tailored descriptions.",
  },
  {
    icon: FolderOpen,
    title: "Directory Tracker",
    description:
      "Track submissions to BetaList, DevHunt, Product Hunt, and dozens more with status updates and tailored copy.",
  },
  {
    icon: Zap,
    title: "Launch Day Playbook",
    description:
      "Hour-by-hour action plan for launch day with contingency plans and real-time task management.",
  },
  {
    icon: BarChart3,
    title: "Post-Launch Metrics",
    description:
      "Track signups, conversion rates, channel performance, and key metrics to measure your launch success.",
  },
];

export default function LandingPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-b from-hero-gradient-from to-hero-gradient-to border-b border-border/40">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 sm:py-28">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/5 px-3 py-1 text-xs font-medium text-accent mb-6">
                <Rocket className="size-3" />
                AI-Powered Launch Planning
              </div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground leading-[1.1]">
                Ship your product
                <br />
                <span className="text-accent">with a plan that works.</span>
              </h1>
              <p className="mt-4 text-[15px] sm:text-base text-muted-foreground leading-relaxed max-w-lg">
                LaunchPad generates a complete go-to-market strategy for your product. From positioning and community seeding to a launch day playbook. All powered by AI.
              </p>
              <div className="mt-8 flex items-center gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground shadow-sm shadow-accent/20 transition-all hover:bg-accent/90 active:scale-[0.98]"
                >
                  Get Started
                  <ArrowRight className="size-4" />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-all hover:bg-muted"
                >
                  Learn More
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-4 sm:px-6 py-20">
          <div className="text-center mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Everything you need to launch
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
              From strategy to execution, LaunchPad covers every step of your product launch.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-xl border border-border/60 bg-card p-6 transition-all hover:border-accent/30 hover:shadow-lg hover:shadow-black/[0.04]"
                >
                  <div className="flex size-10 items-center justify-center rounded-lg bg-accent/10 text-accent mb-4">
                    <Icon className="size-5" />
                  </div>
                  <h3 className="text-[15px] font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-[13px] text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-border/40 bg-gradient-to-b from-hero-gradient-from to-background">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-20 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Ready to launch?
            </h2>
            <p className="mt-3 text-sm text-muted-foreground max-w-md mx-auto">
              Sign in with Google and create your first launch strategy in minutes.
            </p>
            <Link
              href="/login"
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-medium text-accent-foreground shadow-sm shadow-accent/20 transition-all hover:bg-accent/90 active:scale-[0.98]"
            >
              <Rocket className="size-4" />
              Get Started Free
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
