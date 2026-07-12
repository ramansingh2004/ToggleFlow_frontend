'use client';

import Link from 'next/link';
import {
  Activity,
  ArrowUpRight,
  CircleCheck,
  FolderKanban,
  KeyRound,
  RefreshCw,
  ToggleLeft,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { useGetDashboardStats } from '@/api/generated/dashboard/dashboard';
import type { DashboardStatsRecentActivityItem } from '@/api/generated/models';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getApiErrorMessage } from '@/utils/get-api-error-message';

export function DashboardOverview() {
  const dashboardQuery = useGetDashboardStats({
    query: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: true,
    },
  });

  if (dashboardQuery.isPending) {
    return <DashboardSkeleton />;
  }

  if (dashboardQuery.isError) {
    return (
      <DashboardError
        message={getApiErrorMessage(
          dashboardQuery.error,
          'Unable to load dashboard statistics.'
        )}
        onRetry={() => dashboardQuery.refetch()}
      />
    );
  }

  const stats = dashboardQuery.data?.data;

  const projects = stats?.projects;
  const flags = stats?.flags;
  const apiKeys = stats?.apiKeys;
  const activity = stats?.recentActivity ?? [];

  const enabledPercentage =
    flags?.enabledPercentage ??
    calculatePercentage(flags?.enabled, flags?.total);

  return (
    <main className="p-5 sm:p-7 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-indigo-300">
              Overview
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">
              Dashboard
            </h1>

            <p className="mt-3 text-sm text-zinc-500">
              Monitor the current state of your ToggleFlow
              workspace.
            </p>
          </div>

          {stats?.summary?.lastUpdated && (
            <p className="text-xs text-zinc-600">
              Updated{' '}
              {formatRelativeTime(
                stats.summary.lastUpdated
              )}
            </p>
          )}
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Projects"
            value={projects?.total ?? 0}
            detail={`${projects?.active ?? 0} active`}
            icon={FolderKanban}
            href="/projects"
            accent="indigo"
          />

          <MetricCard
            label="Feature flags"
            value={flags?.total ?? 0}
            detail={`${flags?.disabled ?? 0} disabled`}
            icon={ToggleLeft}
            href="/flags"
            accent="violet"
          />

          <MetricCard
            label="Enabled flags"
            value={`${Math.round(enabledPercentage)}%`}
            detail={`${flags?.enabled ?? 0} currently enabled`}
            icon={CircleCheck}
            href="/flags"
            accent="emerald"
          />

          <MetricCard
            label="API keys"
            value={apiKeys?.total ?? 0}
            detail={`${apiKeys?.active ?? 0} active`}
            icon={KeyRound}
            href="/api-keys"
            accent="cyan"
          />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <RecentActivity items={activity} />

          <div className="space-y-6">
            <WorkspaceHealth
              activeProjects={projects?.active ?? 0}
              totalProjects={projects?.total ?? 0}
              enabledFlags={flags?.enabled ?? 0}
              totalFlags={flags?.total ?? 0}
              activeKeys={apiKeys?.active ?? 0}
              totalKeys={apiKeys?.total ?? 0}
            />

            <div className="rounded-2xl border border-indigo-400/15 bg-gradient-to-br from-indigo-500/10 via-white/[0.025] to-violet-500/5 p-5">
              <p className="text-sm font-medium text-white">
                Ready to ship?
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Create a project and control your first
                feature release.
              </p>

              <Button
                nativeButton={false}
                render={<Link href="/projects" />}
                className="mt-5 bg-indigo-500 text-white hover:bg-indigo-400"
              >
                  View projects
                  <ArrowUpRight className="size-4" />
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

interface MetricCardProps {
  label: string;
  value: number | string;
  detail: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  href: string;
  accent: 'indigo' | 'violet' | 'emerald' | 'cyan';
}

const accentStyles = {
  indigo:
    'bg-indigo-500/10 text-indigo-300 border-indigo-400/15',
  violet:
    'bg-violet-500/10 text-violet-300 border-violet-400/15',
  emerald:
    'bg-emerald-500/10 text-emerald-300 border-emerald-400/15',
  cyan: 'bg-cyan-500/10 text-cyan-300 border-cyan-400/15',
};

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  href,
  accent,
}: MetricCardProps) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition-all hover:-translate-y-0.5 hover:border-white/[0.13] hover:bg-white/[0.04]"
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex size-10 items-center justify-center rounded-xl border ${accentStyles[accent]}`}
        >
          <Icon className="size-4" />
        </div>

        <ArrowUpRight className="size-4 text-zinc-700 transition-colors group-hover:text-zinc-400" />
      </div>

      <p className="mt-6 text-3xl font-semibold tracking-[-0.04em] text-white">
        {value}
      </p>

      <p className="mt-1 text-sm font-medium text-zinc-300">
        {label}
      </p>

      <p className="mt-2 text-xs text-zinc-600">
        {detail}
      </p>
    </Link>
  );
}

function RecentActivity({
  items,
}: {
  items: DashboardStatsRecentActivityItem[];
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02]">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
        <div>
          <h2 className="text-sm font-medium text-white">
            Recent activity
          </h2>
          <p className="mt-1 text-xs text-zinc-600">
            Latest changes across your workspace
          </p>
        </div>

        <Activity className="size-4 text-zinc-600" />
      </div>

      {items.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03]">
            <Activity className="size-5 text-zinc-600" />
          </div>

          <p className="mt-4 text-sm font-medium text-zinc-300">
            No activity yet
          </p>

          <p className="mt-2 max-w-xs text-xs leading-5 text-zinc-600">
            Project and feature flag changes will appear
            here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-white/[0.06]">
          {items.slice(0, 8).map((item, index) => (
            <div
              key={item.id ?? `${item.action}-${index}`}
              className="flex items-start gap-3 px-5 py-4"
            >
              <div className="mt-1 size-2 rounded-full bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.6)]" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-zinc-300">
                  {formatAction(item.action)}
                </p>

                <p className="mt-1 text-xs text-zinc-600">
                  {item.entityType ?? 'Workspace'}
                  {item.timestamp
                    ? ` · ${formatRelativeTime(item.timestamp)}`
                    : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface WorkspaceHealthProps {
  activeProjects: number;
  totalProjects: number;
  enabledFlags: number;
  totalFlags: number;
  activeKeys: number;
  totalKeys: number;
}

function WorkspaceHealth({
  activeProjects,
  totalProjects,
  enabledFlags,
  totalFlags,
  activeKeys,
  totalKeys,
}: WorkspaceHealthProps) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <h2 className="text-sm font-medium text-white">
        Workspace health
      </h2>

      <p className="mt-1 text-xs text-zinc-600">
        Current resource status
      </p>

      <div className="mt-6 space-y-5">
        <HealthRow
          label="Active projects"
          current={activeProjects}
          total={totalProjects}
          color="bg-indigo-400"
        />

        <HealthRow
          label="Enabled flags"
          current={enabledFlags}
          total={totalFlags}
          color="bg-violet-400"
        />

        <HealthRow
          label="Active API keys"
          current={activeKeys}
          total={totalKeys}
          color="bg-cyan-400"
        />
      </div>
    </div>
  );
}

function HealthRow({
  label,
  current,
  total,
  color,
}: {
  label: string;
  current: number;
  total: number;
  color: string;
}) {
  const percentage = calculatePercentage(current, total);

  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-500">{label}</span>
        <span className="font-mono text-zinc-400">
          {current}/{total}
        </span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function DashboardError({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
      <div className="max-w-sm text-center">
        <p className="text-sm font-medium text-zinc-200">
          Dashboard unavailable
        </p>

        <p className="mt-2 text-sm text-zinc-600">
          {message}
        </p>

        <Button
          variant="outline"
          className="mt-5 border-white/10 bg-white/[0.03]"
          onClick={onRetry}
        >
          <RefreshCw className="size-4" />
          Try again
        </Button>
      </div>
    </main>
  );
}

function DashboardSkeleton() {
  return (
    <main className="p-5 sm:p-7 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <Skeleton className="h-4 w-20 bg-white/[0.06]" />
        <Skeleton className="mt-3 h-9 w-52 bg-white/[0.06]" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full bg-white/[0.04]" />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-48 rounded-2xl bg-white/[0.04]"
            />
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <Skeleton className="h-96 rounded-2xl bg-white/[0.04]" />

          <div className="space-y-6">
            <Skeleton className="h-64 rounded-2xl bg-white/[0.04]" />
            <Skeleton className="h-44 rounded-2xl bg-white/[0.04]" />
          </div>
        </div>
      </div>
    </main>
  );
}

function calculatePercentage(
  current = 0,
  total = 0
): number {
  if (total <= 0) return 0;

  return Math.min(
    100,
    Math.max(0, (current / total) * 100)
  );
}

function formatRelativeTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'recently';
  }

  return formatDistanceToNow(date, {
    addSuffix: true,
  });
}

function formatAction(action?: string): string {
  if (!action) return 'Workspace updated';

  return action
    .replace(/[._-]+/g, ' ')
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}