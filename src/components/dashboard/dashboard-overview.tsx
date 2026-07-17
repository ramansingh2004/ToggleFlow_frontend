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
            <p className="text-sm font-medium text-primary">
              Overview
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground">
              Dashboard
            </h1>

            <p className="mt-3 text-sm text-muted-foreground">
              Monitor the current state of your ToggleFlow
              workspace.
            </p>
          </div>

          {stats?.summary?.lastUpdated && (
            <p className="text-xs text-muted-foreground">
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
            accent="primary"
          />

          <MetricCard
            label="Feature flags"
            value={flags?.total ?? 0}
            detail={`${flags?.disabled ?? 0} disabled`}
            icon={ToggleLeft}
            href="/flags"
            accent="neutral"
          />

          <MetricCard
            label="Enabled flags"
            value={`${Math.round(enabledPercentage)}%`}
            detail={`${flags?.enabled ?? 0} currently enabled`}
            icon={CircleCheck}
            href="/flags"
            accent="success"
          />

          <MetricCard
            label="API keys"
            value={apiKeys?.total ?? 0}
            detail={`${apiKeys?.active ?? 0} active`}
            icon={KeyRound}
            href="/api-keys"
            accent="primary"
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

            <div className="rounded-2xl border border-primary/30 bg-card p-5">
              <p className="text-sm font-medium text-foreground">
                Ready to ship?
              </p>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Create a project and control your first
                feature release.
              </p>

              <Button
                nativeButton={false}
                render={<Link href="/projects" />}
                className="mt-5 bg-primary text-primary-foreground hover:bg-primary-hover"
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
  accent: 'primary' | 'neutral' | 'success';
}

const accentStyles = {
  primary:
    'bg-primary-subtle text-primary border-primary/30',
  neutral:
    'bg-surface-elevated text-foreground-secondary border-border',
  success:
    'bg-success-subtle text-success border-success/30',
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
      className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-border hover:bg-surface-elevated"
    >
      <div className="flex items-center justify-between">
        <div
          className={`flex size-10 items-center justify-center rounded-xl border ${accentStyles[accent]}`}
        >
          <Icon className="size-4" />
        </div>

        <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-foreground-secondary" />
      </div>

      <p className="mt-6 text-3xl font-semibold tracking-[-0.04em] text-foreground">
        {value}
      </p>

      <p className="mt-1 text-sm font-medium text-foreground-secondary">
        {label}
      </p>

      <p className="mt-2 text-xs text-muted-foreground">
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
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-medium text-foreground">
            Recent activity
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Latest changes across your workspace
          </p>
        </div>

        <Activity className="size-4 text-muted-foreground" />
      </div>

      {items.length === 0 ? (
        <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
          <div className="flex size-11 items-center justify-center rounded-xl border border-border bg-card">
            <Activity className="size-5 text-muted-foreground" />
          </div>

          <p className="mt-4 text-sm font-medium text-foreground-secondary">
            No activity yet
          </p>

          <p className="mt-2 max-w-xs text-xs leading-5 text-muted-foreground">
            Project and feature flag changes will appear
            here.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {items.slice(0, 8).map((item, index) => (
            <div
              key={item.id ?? `${item.action}-${index}`}
              className="flex items-start gap-3 px-5 py-4"
            >
              <div className="mt-1 size-2 rounded-full bg-primary" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground-secondary">
                  {formatAction(item.action)}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
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
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-sm font-medium text-foreground">
        Workspace health
      </h2>

      <p className="mt-1 text-xs text-muted-foreground">
        Current resource status
      </p>

      <div className="mt-6 space-y-5">
        <HealthRow
          label="Active projects"
          current={activeProjects}
          total={totalProjects}
          color="bg-primary"
        />

        <HealthRow
          label="Enabled flags"
          current={enabledFlags}
          total={totalFlags}
          color="bg-surface-elevated"
        />

        <HealthRow
          label="Active API keys"
          current={activeKeys}
          total={totalKeys}
          color="bg-primary-subtle"
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
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono text-foreground-secondary">
          {current}/{total}
        </span>
      </div>

      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-elevated">
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
        <p className="text-sm font-medium text-foreground">
          Dashboard unavailable
        </p>

        <p className="mt-2 text-sm text-muted-foreground">
          {message}
        </p>

        <Button
          variant="outline"
          className="mt-5 border-border bg-card"
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
        <Skeleton className="h-4 w-20 bg-surface-elevated" />
        <Skeleton className="mt-3 h-9 w-52 bg-surface-elevated" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full bg-surface-elevated" />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-48 rounded-2xl bg-surface-elevated"
            />
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
          <Skeleton className="h-96 rounded-2xl bg-surface-elevated" />

          <div className="space-y-6">
            <Skeleton className="h-64 rounded-2xl bg-surface-elevated" />
            <Skeleton className="h-44 rounded-2xl bg-surface-elevated" />
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
