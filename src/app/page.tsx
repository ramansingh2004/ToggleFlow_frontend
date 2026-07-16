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
    color: 'indigo',
  },
  {
    icon: Gauge,
    title: 'Gradual rollouts',
    description:
      'Release to deterministic user percentages and roll back instantly.',
    color: 'fuchsia',
  },
  {
    icon: GitBranch,
    title: 'Environments',
    description:
      'Keep development, staging, and production configurations isolated.',
    color: 'cyan',
  },
  {
    icon: ListFilter,
    title: 'User segments',
    description:
      'Build reusable audiences from email, country, and custom attributes.',
    color: 'emerald',
  },
  {
    icon: BarChart3,
    title: 'Analytics',
    description:
      'Understand flag evaluations, impressions, and conversion performance.',
    color: 'amber',
  },
  {
    icon: CalendarClock,
    title: 'Scheduled changes',
    description:
      'Enable or disable releases automatically at a future time.',
    color: 'violet',
  },
  {
    icon: Webhook,
    title: 'Signed webhooks',
    description:
      'Notify deployment, monitoring, and communication systems securely.',
    color: 'rose',
  },
  {
    icon: Users,
    title: 'Team access',
    description:
      'Collaborate with clear ownership and role-based project permissions.',
    color: 'blue',
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
    <div className="min-h-screen overflow-hidden bg-[#07090f] text-zinc-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-[-420px] size-[850px] -translate-x-1/2 rounded-full bg-indigo-600/[0.12] blur-[140px]" />

        <div className="absolute right-[-260px] top-[35%] size-[520px] rounded-full bg-fuchsia-600/[0.07] blur-[130px]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '44px 44px',
          }}
        />
      </div>

      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/[0.07] bg-[#07090f]/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-7">
          <Link
            href="/"
            className="flex items-center gap-3"
          >
            <div className="flex size-9 items-center justify-center rounded-xl border border-indigo-400/25 bg-indigo-500/10 shadow-[0_0_28px_rgba(99,102,241,0.14)]">
              <Braces className="size-4 text-indigo-300" />
            </div>

            <div>
              <p className="text-sm font-semibold tracking-tight text-white">
                ToggleFlow
              </p>

              <p className="text-[9px] uppercase tracking-[0.18em] text-zinc-600">
                Release control
              </p>
            </div>
          </Link>

          <nav className="hidden items-center gap-7 md:flex">
            <a
              href="#features"
              className="text-xs text-zinc-500 transition-colors hover:text-zinc-200"
            >
              Features
            </a>

            <a
              href="#workflow"
              className="text-xs text-zinc-500 transition-colors hover:text-zinc-200"
            >
              Workflow
            </a>

            <a
              href="#developers"
              className="text-xs text-zinc-500 transition-colors hover:text-zinc-200"
            >
              Developers
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden h-9 items-center rounded-lg px-4 text-sm text-zinc-400 transition-colors hover:bg-white/[0.05] hover:text-white sm:inline-flex"
            >
              Sign in
            </Link>

            <Link
              href="/register"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-indigo-500 px-4 text-sm font-medium text-white shadow-[0_0_24px_rgba(99,102,241,0.18)] transition-colors hover:bg-indigo-400"
            >
              Get started
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative">
        <section className="px-5 pb-24 pt-36 sm:px-7 sm:pt-44 lg:pb-32">
          <div className="mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/15 bg-indigo-500/[0.07] px-3 py-1.5">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
                </span>

                <span className="text-[11px] font-medium text-indigo-200/70">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="size-3 text-violet-300" />
                    Built for modern engineering teams
                  </span>
                </span>
              </div>

              <h1 className="mt-7 max-w-3xl text-5xl font-semibold leading-[1.04] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">
                Release features
                <span className="block bg-gradient-to-r from-indigo-300 via-violet-300 to-fuchsia-300 bg-clip-text text-transparent">
                  without the risk.
                </span>
              </h1>

              <p className="mt-7 max-w-xl text-base leading-8 text-zinc-500 sm:text-lg">
                ToggleFlow gives developers one control plane
                for feature flags, gradual rollouts, user
                targeting, experiments, and release analytics.
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/register"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 text-sm font-medium text-white shadow-[0_0_32px_rgba(99,102,241,0.2)] transition-all hover:bg-indigo-400"
                >
                  Start building
                  <ArrowRight className="size-4" />
                </Link>

                <Link
                  href="/login"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.09] bg-white/[0.025] px-5 text-sm text-zinc-300 transition-colors hover:bg-white/[0.06]"
                >
                  <Terminal className="size-4 text-zinc-500" />
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

        <section className="relative border-y border-white/[0.06] bg-white/[0.012] px-5 py-24 sm:px-7 lg:py-32">
          <div className="pointer-events-none absolute left-1/2 top-1/2 size-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/[0.055] blur-[130px]" />

          <div className="relative mx-auto grid max-w-7xl items-center gap-16 lg:grid-cols-[0.82fr_1.18fr]">
            <div>
              <p className="text-sm font-medium text-indigo-300">
                Decouple deploy from release
              </p>

              <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                Your code can be live before your feature is.
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-500">
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
          className="scroll-mt-20 border-y border-white/[0.06] bg-white/[0.012] px-5 py-24 sm:px-7 lg:py-32"
        >
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-indigo-300">
                Developer-first API
              </p>

              <h2 className="mt-4 max-w-xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
                A small integration surface with powerful
                release control.
              </h2>

              <p className="mt-5 max-w-xl text-sm leading-7 text-zinc-500">
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
                  className="relative rounded-2xl border border-white/[0.07] bg-white/[0.02] p-6"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-indigo-300">
                      {item.number}
                    </span>

                    {index < workflow.length - 1 && (
                      <ArrowRight className="hidden size-4 text-zinc-800 md:block" />
                    )}
                  </div>

                  <h3 className="mt-8 text-base font-medium text-zinc-200">
                    {item.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-zinc-600">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-24 sm:px-7 lg:pb-32">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-3xl border border-indigo-400/15 bg-gradient-to-br from-indigo-500/[0.12] via-white/[0.025] to-fuchsia-500/[0.08] p-8 text-center sm:p-14">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10">
              <Braces className="size-5 text-indigo-300" />
            </div>

            <h2 className="mx-auto mt-6 max-w-2xl text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
              Make your next release reversible.
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-zinc-500">
              Create a project, connect your application, and
              control your first feature without another
              deployment.
            </p>

            <Link
              href="/register"
              className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-500 px-5 text-sm font-medium text-white hover:bg-indigo-400"
            >
              Create your account
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-white/[0.07] px-5 py-8 sm:px-7">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
          <div className="flex items-center gap-2">
            <Braces className="size-4 text-indigo-300" />

            <span className="text-sm font-medium text-zinc-300">
              ToggleFlow
            </span>
          </div>

          <p className="text-xs text-zinc-700">
            Feature release infrastructure for developers.
          </p>

          <div className="flex items-center gap-5">
            <Link
              href="/login"
              className="text-xs text-zinc-600 hover:text-zinc-300"
            >
              Sign in
            </Link>

            <Link
              href="/register"
              className="text-xs text-zinc-600 hover:text-zinc-300"
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
    <section className="border-y border-white/[0.06] bg-white/[0.012] px-5 sm:px-7">
      <div className="mx-auto grid max-w-7xl divide-y divide-white/[0.06] sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.value} className="px-5 py-7 lg:px-7">
            <p className="text-sm font-medium text-zinc-300">
              {item.value}
            </p>
            <p className="mt-1 text-[11px] text-zinc-700">
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
      color: 'text-cyan-300 bg-cyan-500/10 border-cyan-400/15',
    },
    {
      icon: CloudCog,
      title: 'Production deploy',
      detail: 'Code is live',
      color: 'text-violet-300 bg-violet-500/10 border-violet-400/15',
    },
    {
      icon: Layers3,
      title: 'ToggleFlow decision',
      detail: 'Flag + segment + rollout',
      color: 'text-indigo-300 bg-indigo-500/10 border-indigo-400/15',
    },
    {
      icon: Users,
      title: 'Selected users',
      detail: 'Stable experience',
      color: 'text-emerald-300 bg-emerald-500/10 border-emerald-400/15',
    },
  ];

  return (
    <div className="relative min-h-[430px] [perspective:1200px]">
      <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-indigo-400/10 bg-indigo-500/[0.04] [transform:rotateX(68deg)]" />
      <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/[0.07] [transform:rotateX(68deg)]" />

      <div className="relative flex min-h-[430px] flex-col justify-center gap-3 [transform:rotateY(-6deg)_rotateX(2deg)] [transform-style:preserve-3d] sm:px-8">
        {stages.map((stage, index) => {
          const Icon = stage.icon;

          return (
            <div
              key={stage.title}
              className="group relative flex items-center gap-4 rounded-2xl border border-white/[0.08] bg-[#0b0e16]/90 p-4 shadow-xl shadow-black/25 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.14] hover:bg-[#0e121d]"
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
                <p className="text-xs font-medium text-zinc-300">
                  {stage.title}
                </p>
                <p className="mt-1 text-[10px] text-zinc-700">
                  {stage.detail}
                </p>
              </div>

              <span className="font-mono text-[9px] text-zinc-800">
                0{index + 1}
              </span>

              {index < stages.length - 1 && (
                <span className="absolute -bottom-3 left-9 z-20 h-3 w-px bg-gradient-to-b from-indigo-400/40 to-transparent" />
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
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
      <Icon className="size-4 text-indigo-300" />
      <p className="mt-3 text-xs font-medium text-zinc-300">
        {title}
      </p>
      <p className="mt-1 text-[11px] leading-5 text-zinc-700">
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
    <article className="group rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.035] to-transparent p-5 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-400/15">
      <div className="flex size-10 items-center justify-center rounded-xl border border-indigo-400/15 bg-indigo-500/10 transition-transform duration-300 group-hover:[transform:translateZ(20px)_rotateY(-8deg)]">
        <Icon className="size-4 text-indigo-300" />
      </div>
      <h3 className="mt-5 text-sm font-medium text-zinc-200">
        {title}
      </h3>
      <p className="mt-2 text-xs leading-5 text-zinc-600">
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
      <div className="absolute inset-6 rounded-full bg-indigo-500/[0.13] blur-[80px]" />

      <div
        className="relative transition-transform duration-200 ease-out [transform-style:preserve-3d]"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
      >
        <div className="pointer-events-none absolute -left-7 top-14 z-20 hidden w-36 rounded-xl border border-cyan-400/15 bg-[#0c121b]/95 p-3 shadow-xl shadow-black/40 backdrop-blur-xl sm:block [transform:translateZ(70px)]">
          <div className="flex items-center gap-2">
            <Globe2 className="size-3.5 text-cyan-300" />
            <span className="text-[10px] text-zinc-400">
              Production
            </span>
          </div>
          <p className="mt-2 font-mono text-[9px] text-emerald-400">
            ● connected
          </p>
        </div>

        <div className="pointer-events-none absolute -right-6 bottom-12 z-20 hidden w-40 rounded-xl border border-fuchsia-400/15 bg-[#100d18]/95 p-3 shadow-xl shadow-black/40 backdrop-blur-xl sm:block [transform:translateZ(90px)]">
          <div className="flex items-center gap-2">
            <Activity className="size-3.5 text-fuchsia-300" />
            <span className="text-[10px] text-zinc-400">
              Live evaluations
            </span>
          </div>
          <div className="mt-3 flex h-7 items-end gap-1">
            {[35, 58, 42, 80, 64, 92, 76, 100].map(
              (height, index) => (
                <span
                  key={`${height}-${index}`}
                  className="flex-1 rounded-sm bg-gradient-to-t from-indigo-500/50 to-fuchsia-300"
                  style={{ height: `${height}%` }}
                />
              )
            )}
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white/[0.11] bg-[#0b0e16]/95 shadow-2xl shadow-black/60 [transform:translateZ(20px)]">
        <div className="flex h-11 items-center justify-between border-b border-white/[0.07] px-4">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-red-400/70" />
            <span className="size-2 rounded-full bg-amber-400/70" />
            <span className="size-2 rounded-full bg-emerald-400/70" />
          </div>

          <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-700">
            Production
          </span>
        </div>

        <div className="border-b border-white/[0.06] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-zinc-600">
                Project
              </p>

              <p className="mt-1 text-sm font-medium text-zinc-200">
                Developer platform
              </p>
            </div>

            <div className="rounded-lg border border-emerald-400/15 bg-emerald-500/10 px-2.5 py-1 text-[10px] text-emerald-300">
              Healthy
            </div>
          </div>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {flags.map((flag) => (
            <div
              key={flag.key}
              className="grid grid-cols-[1fr_80px_54px] items-center gap-3 px-5 py-4"
            >
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-zinc-300">
                  {flag.name}
                </p>

                <code className="mt-1 block truncate text-[10px] text-zinc-700">
                  {flag.key}
                </code>
              </div>

              <div>
                <div className="h-1 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-400"
                    style={{
                      width: flag.rollout,
                    }}
                  />
                </div>

                <p className="mt-1 text-right font-mono text-[9px] text-zinc-700">
                  {flag.rollout}
                </p>
              </div>

              <div
                className={
                  flag.enabled
                    ? 'ml-auto flex h-6 w-10 items-center justify-end rounded-full bg-indigo-500 p-1'
                    : 'ml-auto flex h-6 w-10 items-center rounded-full bg-white/[0.08] p-1'
                }
              >
                <span className="size-4 rounded-full bg-white shadow-sm" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.06] bg-black/20 px-5 py-3">
          <span className="font-mono text-[9px] text-zinc-700">
            last synced 4s ago
          </span>

          <span className="flex items-center gap-1.5 text-[9px] text-emerald-400">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            API connected
          </span>
        </div>
      </div>

        <div className="pointer-events-none absolute inset-x-10 -bottom-8 h-20 rounded-[50%] bg-black/70 blur-2xl [transform:translateZ(-70px)_rotateX(75deg)]" />
      </div>

      <p className="mt-8 text-center font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-700">
        Move your pointer to explore the control plane
      </p>
    </div>
  );
}

function ApiPreview() {
  return (
    <div className="relative [perspective:1000px]">
      <div className="absolute -inset-8 bg-cyan-500/[0.045] blur-3xl" />

      <div className="relative overflow-hidden rounded-2xl border border-white/[0.09] bg-[#07090f] shadow-2xl shadow-black/30 transition-transform duration-500 hover:[transform:rotateX(1deg)_rotateY(-2deg)_translateY(-4px)]">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
        <div className="flex items-center gap-2">
          <Terminal className="size-3.5 text-zinc-600" />

          <span className="font-mono text-[10px] text-zinc-600">
            toggleflow.ts
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full border border-white/[0.07] bg-white/[0.03] px-2 py-1 font-mono text-[8px] text-zinc-600">
            @toggleflow/node
          </span>
          <span className="text-[9px] text-emerald-400">
            TypeScript
          </span>
        </div>
      </div>

      <pre className="overflow-x-auto p-5 text-xs leading-7">
        <code>
          <span className="text-fuchsia-300">
            {'import '}
          </span>
          <span className="text-zinc-500">{'{ '}</span>
          <span className="text-cyan-300">ToggleFlow</span>
          <span className="text-zinc-500">{' } from '}</span>
          <span className="text-emerald-300">
            {"'@toggleflow/node'"}
          </span>
          <span className="text-zinc-500">{';'}</span>
          {'\n\n'}
          <span className="text-fuchsia-300">
            {'const '}
          </span>
          <span className="text-zinc-300">toggleflow</span>
          <span className="text-zinc-500">{' = new '}</span>
          <span className="text-cyan-300">ToggleFlow</span>
          <span className="text-zinc-500">{'({'}</span>
          {'\n'}
          <span className="text-indigo-300">{'  apiKey: '}</span>
          <span className="text-zinc-300">
            process.env.TOGGLEFLOW_API_KEY
          </span>
          <span className="text-zinc-500">{'!,'}</span>
          {'\n'}
          <span className="text-zinc-500">{'});'}</span>
          {'\n\n'}
          <span className="text-fuchsia-300">{'const '}</span>
          <span className="text-zinc-300">enabled</span>
          <span className="text-zinc-500">{' = '}</span>
          <span className="text-fuchsia-300">{'await '}</span>
          <span className="text-zinc-300">toggleflow.</span>
          <span className="text-cyan-300">isEnabled</span>
          <span className="text-zinc-500">{'('}</span>
          {'\n'}
          <span className="text-emerald-300">
            {"  'new_dashboard',"}
          </span>
          {'\n'}
          <span className="text-zinc-500">{'  { userId: user.id },'}</span>
          {'\n'}
          <span className="text-amber-300">{'  false'}</span>
          <span className="text-zinc-600">
            {' // safe fallback'}
          </span>
          {'\n'}
          <span className="text-zinc-500">{');'}</span>
        </code>
      </pre>

      <div className="flex items-center justify-between border-t border-white/[0.06] bg-white/[0.015] px-5 py-3">
        <span className="text-[9px] text-zinc-700">
          cached evaluation
        </span>
        <span className="flex items-center gap-1.5 text-[9px] text-emerald-400">
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
    indigo:
      'border-indigo-400/15 bg-indigo-500/10 text-indigo-300',
    fuchsia:
      'border-fuchsia-400/15 bg-fuchsia-500/10 text-fuchsia-300',
    cyan:
      'border-cyan-400/15 bg-cyan-500/10 text-cyan-300',
    emerald:
      'border-emerald-400/15 bg-emerald-500/10 text-emerald-300',
    amber:
      'border-amber-400/15 bg-amber-500/10 text-amber-300',
    violet:
      'border-violet-400/15 bg-violet-500/10 text-violet-300',
    rose:
      'border-rose-400/15 bg-rose-500/10 text-rose-300',
    blue:
      'border-blue-400/15 bg-blue-500/10 text-blue-300',
  };

  return (
    <article className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition-all hover:-translate-y-0.5 hover:border-white/[0.12] hover:bg-white/[0.035]">
      <div
        className={`flex size-9 items-center justify-center rounded-xl border ${colors[color]}`}
      >
        <Icon className="size-4" />
      </div>

      <h3 className="mt-5 text-sm font-medium text-zinc-200">
        {title}
      </h3>

      <p className="mt-2 text-xs leading-5 text-zinc-600">
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
      <p className="text-sm font-medium text-indigo-300">
        {eyebrow}
      </p>

      <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl">
        {title}
      </h2>

      <p className="mt-5 text-sm leading-7 text-zinc-500">
        {description}
      </p>
    </div>
  );
}

function TrustItem({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <Check className="size-3.5 text-emerald-400" />

      <span className="text-xs text-zinc-600">
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
      <div className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
        <Check className="size-3 text-emerald-400" />
      </div>

      <div>
        <p className="text-sm text-zinc-300">
          {title}
        </p>

        <p className="mt-1 text-xs leading-5 text-zinc-600">
          {description}
        </p>
      </div>
    </div>
  );
}