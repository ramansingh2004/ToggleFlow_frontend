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
          className="inline-flex items-center gap-2 text-sm text-zinc-600 transition-colors hover:text-zinc-300"
        >
          <ArrowLeft className="size-4" />
          Back to environments
        </Link>

        <header className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
            <div className="flex items-start gap-4">
              <EnvironmentIcon type={type} />

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold tracking-[-0.03em] text-white">
                    {environment.name ??
                      'Unnamed environment'}
                  </h1>

                  <EnvironmentBadge type={type} />
                </div>

                <p className="mt-2 font-mono text-xs text-zinc-600">
                  {environment.id ?? environmentId}
                </p>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-500">
                  {environment.description ||
                    'No environment description has been added.'}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              className="border-white/10 bg-white/[0.025]"
              disabled
            >
              Edit environment
            </Button>
          </div>

          {type === 'production' && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-400/15 bg-amber-500/[0.06] p-4">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-300" />

              <div>
                <p className="text-xs font-medium text-amber-200">
                  Production environment
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-200/50">
                  Changes here may affect live users.
                  Production environments cannot be deleted.
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 grid gap-3 border-t border-white/[0.06] pt-5 sm:grid-cols-3">
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
      'border-blue-400/15 bg-blue-500/10 text-blue-300',
    staging:
      'border-amber-400/15 bg-amber-500/10 text-amber-300',
    production:
      'border-emerald-400/15 bg-emerald-500/10 text-emerald-300',
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
      'border-blue-400/15 bg-blue-500/10 text-blue-300',
    staging:
      'border-amber-400/15 bg-amber-500/10 text-amber-300',
    production:
      'border-emerald-400/15 bg-emerald-500/10 text-emerald-300',
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
    <div className="flex items-center gap-3 rounded-xl bg-white/[0.025] px-4 py-3">
      <Icon className="size-4 text-zinc-600" />

      <div>
        <p className="text-xs text-zinc-600">{label}</p>
        <p className="mt-0.5 text-sm font-medium text-zinc-200">
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
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02]">
      <div className="border-b border-white/[0.07] px-5 py-4">
        <h2 className="text-sm font-medium text-white">
          Feature flags
        </h2>

        <p className="mt-1 text-xs text-zinc-600">
          Flags associated with this environment
        </p>
      </div>

      {flags.length === 0 ? (
        <EmptyPanel message="No feature flags are associated with this environment." />
      ) : (
        <div className="divide-y divide-white/[0.06] p-3">
          {flags.map((flag, index) => (
            <div
              key={flag.id ?? index}
              className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/[0.03]"
            >
              <div
                className={
                  flag.enabled
                    ? 'size-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
                    : 'size-2 rounded-full bg-zinc-700'
                }
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-zinc-300">
                  {flag.name ?? 'Unnamed flag'}
                </p>

                <p className="mt-1 truncate font-mono text-xs text-zinc-600">
                  {flag.key ?? 'no_key'}
                </p>
              </div>

              <span className="text-xs text-zinc-600">
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
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02]">
      <div className="border-b border-white/[0.07] px-5 py-4">
        <h2 className="text-sm font-medium text-white">
          API keys
        </h2>

        <p className="mt-1 text-xs text-zinc-600">
          Keys scoped to this environment
        </p>
      </div>

      {apiKeys.length === 0 ? (
        <EmptyPanel message="No API keys are scoped to this environment." />
      ) : (
        <div className="divide-y divide-white/[0.06] p-3">
          {apiKeys.map((apiKey, index) => (
            <div
              key={apiKey.id ?? index}
              className="flex items-center gap-3 rounded-xl px-3 py-3 hover:bg-white/[0.03]"
            >
              <div className="flex size-9 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-500/10">
                <KeyRound className="size-4 text-cyan-300" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-zinc-300">
                  {apiKey.name ?? 'Unnamed key'}
                </p>

                <p className="mt-1 font-mono text-xs text-zinc-600">
                  {apiKey.prefix ?? 'unknown'}••••••••
                </p>
              </div>

              <span
                className={
                  apiKey.isActive
                    ? 'text-xs text-emerald-400'
                    : 'text-xs text-zinc-600'
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
    <div className="flex min-h-64 items-center justify-center px-6 text-center text-sm text-zinc-600">
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
        <p className="text-sm text-zinc-300">
          Unable to load this environment.
        </p>

        <Button
          variant="outline"
          className="mt-5 border-white/10 bg-transparent"
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
        <Skeleton className="h-5 w-40 bg-white/[0.04]" />
        <Skeleton className="mt-6 h-72 rounded-2xl bg-white/[0.04]" />

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <Skeleton className="h-96 rounded-2xl bg-white/[0.04]" />
          <Skeleton className="h-96 rounded-2xl bg-white/[0.04]" />
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