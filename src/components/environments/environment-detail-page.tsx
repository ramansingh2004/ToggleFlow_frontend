'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Boxes,
  Calendar,
  KeyRound,
  RefreshCw,
  ShieldAlert,
  ToggleLeft,
} from 'lucide-react';

import { useGetEnvironment } from '@/api/generated/environments/environments';
import type {
  ApiKeySummary,
  FeatureFlagSummary,
} from '@/api/generated/models';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EnvironmentActions } from '@/components/environments/environment-actions';

interface EnvironmentDetailPageProps {
  environmentId: string;
}

export function EnvironmentDetailPage({
  environmentId,
}: EnvironmentDetailPageProps) {
  const environmentQuery = useGetEnvironment(
    environmentId,
    {
      query: {
        staleTime: 60 * 1000,
      },
    }
  );

  if (environmentQuery.isPending) {
    return <EnvironmentDetailSkeleton />;
  }

  if (
    environmentQuery.isError ||
    !environmentQuery.data?.data
  ) {
    return (
      <EnvironmentDetailError
        onRetry={() => environmentQuery.refetch()}
      />
    );
  }

  const environment = environmentQuery.data.data;
  const flags = environment.flags ?? [];
  const apiKeys = environment.apiKeys ?? [];
  const type = environment.type ?? 'development';

  return (
    <main className="p-5 sm:p-7 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/environments"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground-secondary"
        >
          <ArrowLeft className="size-4" />
          Back to environments
        </Link>

        <header className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
            <div className="flex items-start gap-4">
              <EnvironmentIcon type={type} />

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
                    {environment.name ??
                      'Unnamed environment'}
                  </h1>

                  <EnvironmentBadge type={type} />
                </div>

                <p className="mt-2 font-mono text-xs text-muted-foreground">
                  {environment.id ?? environmentId}
                </p>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
                  {environment.description ||
                    'No environment description has been added.'}
                </p>
              </div>
            </div>

            <EnvironmentActions
              environment={environment}
              environmentId={environmentId}
            />
          </div>

          {type === 'production' && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-subtle p-4">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" />

              <div>
                <p className="text-xs font-medium text-warning">
                  Production environment
                </p>

                <p className="mt-1 text-xs leading-5 text-warning">
                  Changes here may affect live users.
                  Production environments cannot be deleted.
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-3 border-t border-border pt-5 sm:grid-cols-3">
            <EnvironmentMetric
              label="Feature flags"
              value={environment.flagCount ?? flags.length}
              icon={ToggleLeft}
            />

            <EnvironmentMetric
              label="API keys"
              value={environment.apiKeyCount ?? apiKeys.length}
              icon={KeyRound}
            />

            <EnvironmentMetric
              label="Created"
              value={formatDate(environment.createdAt)}
              icon={Calendar}
            />
          </div>
        </header>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <FlagsPanel flags={flags} />
          <ApiKeysPanel apiKeys={apiKeys} />
        </div>
      </div>
    </main>
  );
}

function EnvironmentIcon({
  type,
}: {
  type: 'development' | 'staging' | 'production';
}) {
  const styles = {
    development:
      'border-border bg-surface-elevated text-foreground-secondary',
    staging:
      'border-warning/30 bg-warning-subtle text-warning',
    production:
      'border-success/30 bg-success-subtle text-success',
  };

  return (
    <div
      className={`flex size-12 shrink-0 items-center justify-center rounded-2xl border ${styles[type]}`}
    >
      <Boxes className="size-5" />
    </div>
  );
}

function EnvironmentBadge({
  type,
}: {
  type: 'development' | 'staging' | 'production';
}) {
  const styles = {
    development:
      'border-border bg-surface-elevated text-foreground-secondary',
    staging:
      'border-warning/30 bg-warning-subtle text-warning',
    production:
      'border-success/30 bg-success-subtle text-success',
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-medium capitalize ${styles[type]}`}
    >
      {type}
    </span>
  );
}

function EnvironmentMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{
    className?: string;
  }>;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-card px-4 py-3">
      <Icon className="size-4 text-muted-foreground" />

      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-foreground">
          {value}
        </p>
      </div>
    </div>
  );
}

function FlagsPanel({
  flags,
}: {
  flags: FeatureFlagSummary[];
}) {
  return (
    <section className="rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-medium text-foreground">
          Feature flags
        </h2>

        <p className="mt-1 text-xs text-muted-foreground">
          Flags associated with this environment
        </p>
      </div>

      {flags.length === 0 ? (
        <EmptyPanel message="No feature flags are associated with this environment." />
      ) : (
        <div className="divide-y divide-border p-3">
          {flags.map((flag, index) => (
            <div
              key={flag.id ?? index}
              className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-card"
            >
              <div
                className={
                  flag.enabled
                    ? 'size-2 rounded-full bg-success'
                    : 'size-2 rounded-full bg-surface-elevated'
                }
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground-secondary">
                  {flag.name ?? 'Unnamed flag'}
                </p>

                <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                  {flag.key ?? 'no_key'}
                </p>
              </div>

              <span className="text-xs text-muted-foreground">
                {flag.enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ApiKeysPanel({
  apiKeys,
}: {
  apiKeys: ApiKeySummary[];
}) {
  return (
    <section className="rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-medium text-foreground">
          API keys
        </h2>

        <p className="mt-1 text-xs text-muted-foreground">
          Keys scoped to this environment
        </p>
      </div>

      {apiKeys.length === 0 ? (
        <EmptyPanel message="No API keys are scoped to this environment." />
      ) : (
        <div className="divide-y divide-border p-3">
          {apiKeys.map((apiKey, index) => (
            <div
              key={apiKey.id ?? index}
              className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-card"
            >
              <div className="flex size-9 items-center justify-center rounded-xl border border-primary/30 bg-primary-subtle">
                <KeyRound className="size-4 text-primary" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-foreground-secondary">
                  {apiKey.name ?? 'Unnamed key'}
                </p>

                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {apiKey.prefix ?? 'unknown'}••••••••
                </p>
              </div>

              <span
                className={
                  apiKey.isActive
                    ? 'text-xs text-success'
                    : 'text-xs text-muted-foreground'
                }
              >
                {apiKey.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function EmptyPanel({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex min-h-64 items-center justify-center px-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function EnvironmentDetailError({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
      <div className="text-center">
        <p className="text-sm text-foreground-secondary">
          Unable to load this environment.
        </p>

        <Button
          variant="outline"
          className="mt-5 border-border bg-transparent"
          onClick={onRetry}
        >
          <RefreshCw className="size-4" />
          Try again
        </Button>
      </div>
    </main>
  );
}

function EnvironmentDetailSkeleton() {
  return (
    <main className="p-5 sm:p-7 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <Skeleton className="h-5 w-40 bg-surface-elevated" />
        <Skeleton className="mt-6 h-72 rounded-2xl bg-surface-elevated" />

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <Skeleton className="h-96 rounded-2xl bg-surface-elevated" />
          <Skeleton className="h-96 rounded-2xl bg-surface-elevated" />
        </div>
      </div>
    </main>
  );
}

function formatDate(value?: string): string {
  if (!value) return 'Unknown';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}
