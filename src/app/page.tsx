'use client';

import { useState, type MouseEvent } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Braces,
  CalendarClock,
  Check,
  CircleDot,
  CloudCog,
  Code2,
  Flag,
  Gauge,
  GitBranch,
  Globe2,
  Layers3,
  ListFilter,
  LockKeyhole,
  PackageCheck,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Terminal,
  Users,
  Webhook,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: Flag,
    title: 'Feature flags',
    description:
      'Ship code safely and control releases independently from deployments.',
    color: 'primary',
  },
  {
    icon: Gauge,
    title: 'Gradual rollouts',
    description:
      'Release to deterministic user percentages and roll back instantly.',
    color: 'neutral',
  },
  {
    icon: GitBranch,
    title: 'Environments',
    description:
      'Keep development, staging, and production configurations isolated.',
    color: 'primary',
  },
  {
    icon: ListFilter,
    title: 'User segments',
    description:
      'Build reusable audiences from email, country, and custom attributes.',
    color: 'success',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description:
      'Understand flag evaluations, impressions, and conversion performance.',
    color: 'warning',
  },
  {
    icon: CalendarClock,
    title: 'Scheduled changes',
    description:
      'Enable or disable releases automatically at a future time.',
    color: 'neutral',
  },
  {
    icon: Webhook,
    title: 'Signed webhooks',
    description:
      'Notify deployment, monitoring, and communication systems securely.',
    color: 'destructive',
  },
  {
    icon: Users,
    title: 'Team access',
    description:
      'Collaborate with clear ownership and role-based project permissions.',
    color: 'neutral',
  },
];

const workflow = [
  {
    number: '01',
    title: 'Create a flag',
    description:
      'Define the release switch in your ToggleFlow control plane.',
  },
  {
    number: '02',
    title: 'Connect your server',
    description:
      'Use a project API key to evaluate flags from trusted backend code.',
  },
  {
    number: '03',
    title: 'Release with confidence',
    description:
      'Target users, monitor results, and roll back without redeploying.',
  },
];

const platformDetails = [
  {
    icon: ShieldCheck,
    title: 'Fail-safe evaluation',
    description:
      'Choose a safe fallback value so an unavailable control plane never takes down your product.',
  },
  {
    icon: LockKeyhole,
    title: 'Secrets stay server-side',
    description:
      'Project API keys remain in trusted backend infrastructure and never enter browser bundles.',
  },
  {
    icon: Activity,
    title: 'Observable releases',
    description:
      'Follow evaluations and conversions while a feature moves from internal users to everyone.',
  },
  {
    icon: RotateCcw,
    title: 'Reversible by design',
    description:
      'Disable a flag or reduce its rollout immediately without reverting code or rebuilding an image.',
  },
];

export default function Home() {
  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-420px] size-[850px] -translate-x-1/2 rounded-full bg-primary-subtle blur-[140px]" />

        <div className="absolute right-[-260px] top-[35%] size-[520px] rounded-full bg-surface-elevated blur-[130px]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(color-mix(in srgb, var(--foreground) 15%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--foreground) 15%, transparent) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
      </div>

      <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-7">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex size-9 items-center justify-center rounded-xl border border-primary/30 bg-primary-subtle">
              <Braces className="size-4 text-primary" />
            </div>

            <div>
              <p className="text-sm font-semibold tracking-tight text-foreground">
                ToggleFlow
              </p>

              <p className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                Release control
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <a
              href="#features"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </a>

            <a
              href="#workflow"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Workflow
            </a>

            <a
              href="#developers"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Developers
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden h-9 items-center rounded-lg px-4 text-sm text-foreground-secondary transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-surface-elevated hover:text-foreground hover:shadow-md active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none sm:inline-flex"
            >
              Sign in
            </Link>

            <Link
              href="/register"
              className="group inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:-translate-y-0.5 hover:bg-primary-hover hover:shadow-lg hover:shadow-primary/20 active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none"
            >
              Get started
              <ArrowRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 motion-reduce:transform-none" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative">
        <section className="px-5 pb-24 pt-36 sm:px-7 sm:pt-44 lg:pb-32">
          <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary-subtle px-3 py-1.5">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-50" />
                  <span className="relative inline-flex size-2 rounded-full bg-success" />
                </span>

                <span className="text-[11px] font-medium text-primary">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="size-3 text-foreground-secondary" />
                    Built for modern engineering teams
                  </span>
                </span>
              </div>

              <h1 className="mt-7 max-w-3xl text-5xl font-semibold leading-[1.04] tracking-[-0.055em] text-foreground sm:text-6xl lg:text-7xl">
                Release features
                <span className="block text-primary">
                  without the risk.
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-base leading-8 text-muted-foreground sm:text-lg">
                ToggleFlow gives developers one control plane
                for feature flags, gradual rollouts, user
                targeting, experiments, and release analytics.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:bg-primary-hover hover:shadow-xl hover:shadow-primary/20 active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none"
                >
                  Start building
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none" />
                </Link>

                <Link
                  href="/login"
                  className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border bg-card px-5 text-sm text-foreground-secondary transition-all duration-200 ease-out hover:-translate-y-1 hover:border-primary/30 hover:bg-surface-elevated hover:text-foreground hover:shadow-lg active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none"
                >
                  <Terminal className="size-4 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:text-primary motion-reduce:transform-none" />
                  Open control plane
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3">
                <TrustItem text="Deterministic rollouts" />
                <TrustItem text="HTTP-only authentication" />
                <TrustItem text="OpenAPI-powered" />
              </div>
            </div>

            <ControlPlanePreview />
          </div>
        </section>

        <PlatformStrip />

        <section
          id="features"
          className="scroll-mt-20 px-5 py-24 sm:px-7 lg:py-32"
        >
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Release infrastructure"
              title="Everything between merge and confidence."
              description="Coordinate complex releases without scattering configuration across scripts, environment variables, and deployment pipelines."
            />

            <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <FeatureCard
                  key={feature.title}
                  {...feature}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-y border-border bg-card px-5 py-24 sm:px-7 lg:py-32">
          <div className="pointer-events-none absolute left-1/2 top-1/2 size-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-subtle blur-[130px]" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[0.82fr_1.18fr]">
            <div>
              <p className="text-sm font-medium text-primary">
                Decouple deploy from release
              </p>

              <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
                Your code can be live before your feature is.
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">
                Deploy guarded code once. ToggleFlow then decides
                who receives it at request time, using the master
                flag, segment rules, and deterministic rollout
                percentage.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <MiniDetail
                  icon={PackageCheck}
                  title="Deploy once"
                  text="The guarded implementation ships with your normal release."
                />
                <MiniDetail
                  icon={Zap}
                  title="Change at runtime"
                  text="Enable, target, or roll back without another build."
                />
              </div>
            </div>

            <ReleasePipeline />
          </div>
        </section>

        <section
          id="developers"
          className="scroll-mt-20 border-y border-border bg-card px-5 py-24 sm:px-7 lg:py-32"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-primary">
                Developer-first API
              </p>

              <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
                A small integration surface with powerful
                release control.
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">
                Evaluate every project flag in one request.
                Provide your application&apos;s stable user ID
                for consistent percentage rollout assignment.
              </p>

              <div className="mt-8 space-y-4">
                <DeveloperBenefit
                  title="Server-side API keys"
                  description="Keep evaluation credentials inside trusted application infrastructure."
                />

                <DeveloperBenefit
                  title="Stable user assignment"
                  description="The same user remains in the same rollout cohort between requests."
                />

                <DeveloperBenefit
                  title="Generated API contract"
                  description="OpenAPI keeps dashboard and backend request models synchronized."
                />
              </div>
            </div>

            <ApiPreview />
          </div>
        </section>

        <section className="px-5 py-24 sm:px-7 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Production details"
              title="Release safety is part of the architecture."
              description="The small details matter when a feature decision sits on the request path. ToggleFlow keeps credentials private, cohorts stable, and failures predictable."
            />

            <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {platformDetails.map((detail) => (
                <DetailCard key={detail.title} {...detail} />
              ))}
            </div>
          </div>
        </section>

        <section
          id="workflow"
          className="scroll-mt-20 px-5 py-24 sm:px-7 lg:py-32"
        >
          <div className="mx-auto max-w-7xl">
            <SectionHeading
              eyebrow="Simple workflow"
              title="From hidden code to measured release."
              description="ToggleFlow separates deployment from release, giving your team time to observe real behavior before committing to every user."
            />

            <div className="mt-14 grid gap-4 md:grid-cols-3">
              {workflow.map((item, index) => (
                <div
                  key={item.number}
                  className="relative rounded-2xl border border-border bg-card p-6"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-primary">
                      {item.number}
                    </span>

                    {index < workflow.length - 1 && (
                      <ArrowRight className="hidden size-4 text-muted-foreground md:block" />
                    )}
                  </div>

                  <h3 className="mt-8 text-base font-medium text-foreground">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-24 sm:px-7 lg:pb-32">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-primary/30 bg-card p-8 text-center sm:p-14">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary-subtle">
              <Braces className="size-5 text-primary" />
            </div>

            <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
              Make your next release reversible.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground">
              Create a project, connect your application, and
              control your first feature without another
              deployment.
            </p>

            <Link
              href="/register"
              className="group mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground shadow-sm transition-all duration-200 ease-out hover:-translate-y-1 hover:bg-primary-hover hover:shadow-xl hover:shadow-primary/20 active:translate-y-0 active:scale-[0.98] motion-reduce:transform-none"
            >
              Create your account
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-border px-5 py-8 sm:px-7">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
          <div className="flex items-center gap-2">
            <Braces className="size-4 text-primary" />

            <span className="text-sm font-medium text-foreground-secondary">
              ToggleFlow
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            Feature release infrastructure for developers.
          </p>

          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="text-xs text-muted-foreground hover:text-foreground-secondary"
            >
              Sign in
            </Link>

            <Link
              href="/register"
              className="text-xs text-muted-foreground hover:text-foreground-secondary"
            >
              Register
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function PlatformStrip() {
  const items = [
    {
      value: '1 SDK call',
      label: 'Evaluate flags for a user',
    },
    {
      value: 'Stable cohorts',
      label: 'Deterministic percentage rollout',
    },
    {
      value: 'Runtime control',
      label: 'Change releases without a build',
    },
    {
      value: 'Safe fallback',
      label: 'Keep the application resilient',
    },
  ];

  return (
    <section className="border-y border-border bg-card px-5 sm:px-7">
      <div className="mx-auto grid max-w-7xl divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.value} className="px-5 py-7 lg:px-7">
            <p className="text-sm font-medium text-foreground-secondary">
              {item.value}
            </p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {item.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ReleasePipeline() {
  const stages = [
    {
      icon: Code2,
      title: 'Application code',
      detail: 'Feature guarded',
      color: 'text-primary bg-primary-subtle border-primary/30',
    },
    {
      icon: CloudCog,
      title: 'Production deploy',
      detail: 'Code is live',
      color: 'text-foreground-secondary bg-surface-elevated border-border',
    },
    {
      icon: Layers3,
      title: 'ToggleFlow decision',
      detail: 'Flag + segment + rollout',
      color: 'text-primary bg-primary-subtle border-primary/30',
    },
    {
      icon: Users,
      title: 'Selected users',
      detail: 'Stable experience',
      color: 'text-success bg-success-subtle border-success/30',
    },
  ];

  return (
    <div className="relative min-h-[430px] [perspective:1200px]">
      <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/30 bg-primary-subtle [transform:rotateX(68deg)]" />
      <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-border [transform:rotateX(68deg)]" />

      <div className="relative flex min-h-[430px] flex-col justify-center gap-3 [transform:rotateY(-6deg)_rotateX(2deg)] [transform-style:preserve-3d] sm:px-8">
        {stages.map((stage, index) => {
          const Icon = stage.icon;

          return (
            <div
              key={stage.title}
              className="group relative flex items-center gap-4 rounded-2xl border border-border bg-card/90 p-4 shadow-xl shadow-black/25 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-border hover:bg-surface-elevated"
              style={{
                marginLeft: `${index * 6}%`,
                marginRight: `${(3 - index) * 4}%`,
                transform: `translateZ(${index * 18}px)`,
              }}
            >
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${stage.color}`}
              >
                <Icon className="size-4" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground-secondary">
                  {stage.title}
                </p>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {stage.detail}
                </p>
              </div>

              <span className="font-mono text-[9px] text-muted-foreground">
                0{index + 1}
              </span>

              {index < stages.length - 1 && (
                <span className="absolute -bottom-3 left-9 z-20 h-3 w-px bg-primary/40" />
              )}
            </div>
          );
        })}
      </div>

      <div className="pointer-events-none absolute bottom-5 left-1/2 h-16 w-3/4 -translate-x-1/2 rounded-[50%] bg-black/70 blur-2xl" />
    </div>
  );
}

function MiniDetail({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <Icon className="size-4 text-primary" />
      <p className="mt-3 text-xs font-medium text-foreground-secondary">
        {title}
      </p>
      <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
        {text}
      </p>
    </div>
  );
}

function DetailCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <article className="group rounded-2xl border border-border bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-primary/30">
      <div className="flex size-10 items-center justify-center rounded-xl border border-primary/30 bg-primary-subtle transition-transform duration-300 group-hover:[transform:translateZ(20px)_rotateY(-8deg)]">
        <Icon className="size-4 text-primary" />
      </div>
      <h3 className="mt-5 text-sm font-medium text-foreground">
        {title}
      </h3>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </article>
  );
}

function ControlPlanePreview() {
  const [tilt, setTilt] = useState({ x: -3, y: 5 });

  const flags = [
    {
      name: 'New dashboard',
      key: 'new_dashboard',
      enabled: true,
      rollout: '75%',
    },
    {
      name: 'AI summaries',
      key: 'ai_summaries',
      enabled: true,
      rollout: '10%',
    },
    {
      name: 'Legacy checkout',
      key: 'legacy_checkout',
      enabled: false,
      rollout: '0%',
    },
  ];

  const handlePointerMove = (
    event: MouseEvent<HTMLDivElement>
  ) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;

    setTilt({
      x: (0.5 - y) * 10,
      y: (x - 0.5) * 12,
    });
  };

  return (
    <div
      className="relative mx-auto w-full max-w-xl py-10 [perspective:1200px]"
      onMouseMove={handlePointerMove}
      onMouseLeave={() => setTilt({ x: -3, y: 5 })}
    >
      <div className="absolute inset-6 rounded-full bg-primary-subtle blur-[80px]" />

      <div
        className="relative transition-transform duration-200 ease-out [transform-style:preserve-3d]"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
      >
        <div className="pointer-events-none absolute -left-7 top-14 z-20 hidden w-36 rounded-xl border border-primary/30 bg-popover/95 p-3 shadow-xl shadow-black/40 backdrop-blur-xl sm:block [transform:translateZ(70px)]">
          <div className="flex items-center gap-2">
            <Globe2 className="size-3.5 text-primary" />
            <span className="text-[10px] text-foreground-secondary">
              Production
            </span>
          </div>
          <p className="mt-2 font-mono text-[9px] text-success">
            ● connected
          </p>
        </div>

        <div className="pointer-events-none absolute -right-6 bottom-12 z-20 hidden w-40 rounded-xl border border-border bg-popover/95 p-3 shadow-xl shadow-black/40 backdrop-blur-xl sm:block [transform:translateZ(90px)]">
          <div className="flex items-center gap-2">
            <Activity className="size-3.5 text-foreground-secondary" />
            <span className="text-[10px] text-foreground-secondary">
              Live evaluations
            </span>
          </div>
          <div className="mt-3 flex h-7 items-end gap-1">
            {[35, 58, 42, 80, 64, 92, 76, 100].map(
              (height, index) => (
                <span
                  key={`${height}-${index}`}
                  className="flex-1 rounded-sm bg-primary"
                  style={{ height: `${height}%` }}
                />
              )
            )}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-border bg-card/95 shadow-2xl shadow-black/60 [transform:translateZ(20px)]">
        <div className="flex h-11 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-destructive" />
            <span className="size-2 rounded-full bg-warning" />
            <span className="size-2 rounded-full bg-success" />
          </div>

          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground">
            Production
          </span>
        </div>

        <div className="border-b border-border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">
                Project
              </p>

              <p className="mt-1 text-sm font-medium text-foreground">
                Developer platform
              </p>
            </div>

            <div className="rounded-lg border border-success/30 bg-success-subtle px-2.5 py-1 text-[10px] text-success">
              Healthy
            </div>
          </div>
        </div>

        <div className="divide-y divide-border">
          {flags.map((flag) => (
            <div
              key={flag.key}
              className="grid grid-cols-[1fr_80px_54px] items-center gap-3 px-5 py-4"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-foreground-secondary">
                  {flag.name}
                </p>

                <code className="mt-1 block truncate text-[10px] text-muted-foreground">
                  {flag.key}
                </code>
              </div>

              <div>
                <div className="h-1 overflow-hidden rounded-full bg-surface-elevated">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{
                      width: flag.rollout,
                    }}
                  />
                </div>

                <p className="mt-1 text-right font-mono text-[9px] text-muted-foreground">
                  {flag.rollout}
                </p>
              </div>

              <div
                className={
                  flag.enabled
                    ? 'ml-auto flex h-6 w-10 items-center justify-end rounded-full bg-primary p-1'
                    : 'ml-auto flex h-6 w-10 items-center rounded-full bg-surface-elevated p-1'
                }
              >
                <span className="size-4 rounded-full bg-foreground shadow-sm" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-background px-5 py-3">
          <span className="font-mono text-[9px] text-muted-foreground">
            last synced 4s ago
          </span>

          <span className="flex items-center gap-1.5 text-[9px] text-success">
            <span className="size-1.5 rounded-full bg-success" />
            API connected
          </span>
        </div>
      </div>

        <div className="pointer-events-none absolute inset-x-10 -bottom-8 h-20 rounded-[50%] bg-black/70 blur-2xl [transform:translateZ(-70px)_rotateX(75deg)]" />
      </div>

      <p className="mt-8 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        Move your pointer to explore the control plane
      </p>
    </div>
  );
}

function ApiPreview() {
  return (
    <div className="relative [perspective:1000px]">
      <div className="absolute -inset-8 bg-primary-subtle blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border border-border bg-background shadow-2xl shadow-black/30 transition-transform duration-500 hover:[transform:rotateX(1deg)_rotateY(-2deg)_translateY(-4px)]">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Terminal className="size-3.5 text-muted-foreground" />

          <span className="font-mono text-[10px] text-muted-foreground">
            toggleflow.ts
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-border bg-card px-2 py-1 font-mono text-[8px] text-muted-foreground">
            @toggleflow/node
          </span>
          <span className="text-[9px] text-success">
            TypeScript
          </span>
        </div>
      </div>

      <pre className="overflow-x-auto p-5 text-xs leading-7">
        <code>
          <span className="text-foreground-secondary">
            {'import '}
          </span>
          <span className="text-muted-foreground">{'{ '}</span>
          <span className="text-primary">ToggleFlow</span>
          <span className="text-muted-foreground">{' } from '}</span>
          <span className="text-success">
            {"'@toggleflow/node'"}
          </span>
          <span className="text-muted-foreground">{';'}</span>
          {'\n\n'}
          <span className="text-foreground-secondary">
            {'const '}
          </span>
          <span className="text-foreground-secondary">toggleflow</span>
          <span className="text-muted-foreground">{' = new '}</span>
          <span className="text-primary">ToggleFlow</span>
          <span className="text-muted-foreground">{'({'}</span>
          {'\n'}
          <span className="text-primary">{'  apiKey: '}</span>
          <span className="text-foreground-secondary">
            process.env.TOGGLEFLOW_API_KEY
          </span>
          <span className="text-muted-foreground">{'!,'}</span>
          {'\n'}
          <span className="text-muted-foreground">{'});'}</span>
          {'\n\n'}
          <span className="text-foreground-secondary">{'const '}</span>
          <span className="text-foreground-secondary">enabled</span>
          <span className="text-muted-foreground">{' = '}</span>
          <span className="text-foreground-secondary">{'await '}</span>
          <span className="text-foreground-secondary">toggleflow.</span>
          <span className="text-primary">isEnabled</span>
          <span className="text-muted-foreground">{'('}</span>
          {'\n'}
          <span className="text-success">
            {"  'new_dashboard',"}
          </span>
          {'\n'}
          <span className="text-muted-foreground">{'  { userId: user.id },'}</span>
          {'\n'}
          <span className="text-warning">{'  false'}</span>
          <span className="text-muted-foreground">
            {' // safe fallback'}
          </span>
          {'\n'}
          <span className="text-muted-foreground">{');'}</span>
        </code>
      </pre>

      <div className="flex items-center justify-between border-t border-border bg-card px-5 py-3">
        <span className="text-[9px] text-muted-foreground">
          cached evaluation
        </span>
        <span className="flex items-center gap-1.5 text-[9px] text-success">
          <CircleDot className="size-3" />
          fallback protected
        </span>
      </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  title: string;
  description: string;
  color: string;
}) {
  const colors: Record<string, string> = {
    primary:
      'border-primary/30 bg-primary-subtle text-primary',
    neutral:
      'border-border bg-surface-elevated text-foreground-secondary',
    success:
      'border-success/30 bg-success-subtle text-success',
    warning:
      'border-warning/30 bg-warning-subtle text-warning',
    destructive:
      'border-destructive/30 bg-destructive-subtle text-destructive',
  };

  return (
    <article className="rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-border hover:bg-card">
      <div
        className={`flex size-9 items-center justify-center rounded-xl border ${colors[color]}`}
      >
        <Icon className="size-4" />
      </div>

      <h3 className="mt-5 text-sm font-medium text-foreground">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </article>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="max-w-2xl">
      <p className="text-sm font-medium text-primary">
        {eyebrow}
      </p>

      <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
        {title}
      </h2>

      <p className="mt-5 text-sm leading-7 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function TrustItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <Check className="size-3.5 text-success" />

      <span className="text-xs text-muted-foreground">
        {text}
      </span>
    </div>
  );
}

function DeveloperBenefit({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-success-subtle">
        <Check className="size-3 text-success" />
      </div>

      <div>
        <p className="text-sm text-foreground-secondary">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}