import type { ReactNode } from 'react';
import {
  Braces,
  GitBranch,
  ShieldCheck,
  ToggleRight,
} from 'lucide-react';

interface AuthShellProps {
  children: ReactNode;
}

const features = [
  {
    icon: ToggleRight,
    title: 'Ship with confidence',
    description:
      'Control releases without redeploying your application.',
  },
  {
    icon: GitBranch,
    title: 'Built for every environment',
    description:
      'Coordinate development, staging, and production flags.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure by default',
    description:
      'Granular access, auditability, and protected API keys.',
  },
];

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-10rem] top-[-12rem] size-[32rem] rounded-full bg-primary-subtle blur-[120px]" />
        <div className="absolute bottom-[-14rem] right-[-10rem] size-[34rem] rounded-full bg-surface-elevated blur-[130px]" />

        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(color-mix(in srgb, var(--foreground) 80%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--foreground) 80%, transparent) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />

        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,var(--background)_75%)]" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[1.05fr_0.95fr]">
        {/* Product panel */}
        <section className="hidden border-r border-border px-12 py-10 lg:flex lg:flex-col xl:px-20">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl border border-primary/30 bg-primary-subtle">
              <Braces className="size-5 text-primary" />
            </div>

            <span className="text-lg font-semibold tracking-tight">
              ToggleFlow
            </span>
          </div>

          <div className="my-auto max-w-xl py-16">
            <div className="mb-6 inline-flex items-center rounded-full border border-primary/30 bg-primary-subtle px-3 py-1 text-xs font-medium text-primary">
              Developer-first feature management
            </div>

            <h1 className="max-w-lg text-4xl font-semibold leading-[1.1] tracking-[-0.04em] text-foreground xl:text-5xl">
              Release features at your pace, not your deploy cycle.
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-foreground-secondary">
              Manage flags, environments, experiments, and rollouts
              from one focused control plane built for engineering
              teams.
            </p>

            <div className="mt-12 space-y-7">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <div
                    key={feature.title}
                    className="flex items-start gap-4"
                  >
                    <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface-elevated">
                      <Icon className="size-4 text-primary" />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {feature.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Built for developers who prefer controlled releases.
          </p>
        </section>

        {/* Form panel */}
        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
          <div className="w-full max-w-[430px]">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex size-9 items-center justify-center rounded-xl border border-primary/30 bg-primary-subtle">
                <Braces className="size-4 text-primary" />
              </div>
              <span className="font-semibold">ToggleFlow</span>
            </div>

            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
