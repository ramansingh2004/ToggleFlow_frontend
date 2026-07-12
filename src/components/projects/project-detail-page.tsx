'use client';

import Link from 'next/link';
import {
  ArrowLeft,
  Boxes,
  Circle,
  FolderKanban,
  KeyRound,
  RefreshCw,
  ToggleLeft,
} from 'lucide-react';

import { useGetEnvironments } from '@/api/generated/environments/environments';
import { useGetFlagsByProjectId } from '@/api/generated/feature-flags/feature-flags';
import type {
  EnvironmentSummary,
  FeatureFlagSummary,
} from '@/api/generated/models';
import { useGetProjectById } from '@/api/generated/projects/projects';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectActions } from '@/components/projects/project-actions';

interface ProjectDetailPageProps {
  projectId: string;
}

export function ProjectDetailPage({
  projectId,
}: ProjectDetailPageProps) {
  const projectQuery = useGetProjectById(projectId, {
    query: {
      staleTime: 60 * 1000,
    },
  });

  const environmentsQuery = useGetEnvironments(projectId, {
    query: {
      staleTime: 60 * 1000,
    },
  });

  const flagsQuery = useGetFlagsByProjectId(projectId, {
    query: {
      staleTime: 30 * 1000,
    },
  });

  if (projectQuery.isPending) {
    return <ProjectDetailSkeleton />;
  }

  if (projectQuery.isError || !projectQuery.data?.data) {
    return (
      <ProjectDetailError
        onRetry={() => projectQuery.refetch()}
      />
    );
  }

  const project = projectQuery.data.data;
  const environments = environmentsQuery.data?.data ?? [];
  const flags = flagsQuery.data?.data ?? [];

  return (
    <main className="p-5 sm:p-7 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/projects"
          className="inline-flex items-center gap-2 text-sm text-zinc-600 transition-colors hover:text-zinc-300"
        >
          <ArrowLeft className="size-4" />
          Back to projects
        </Link>

        <header className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-indigo-400/15 bg-indigo-500/10">
                <FolderKanban className="size-5 text-indigo-300" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold tracking-[-0.03em] text-white">
                    {project.name ?? 'Untitled project'}
                  </h1>

                  <span
                    className={
                      project.isActive
                        ? 'rounded-full border border-emerald-400/15 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-300'
                        : 'rounded-full border border-zinc-400/10 bg-zinc-500/10 px-2.5 py-1 text-[10px] font-medium text-zinc-500'
                    }
                  >
                    {project.isActive
                      ? 'Active'
                      : 'Inactive'}
                  </span>
                </div>

                <p className="mt-1 font-mono text-xs text-zinc-600">
                  {project.slug ?? projectId}
                </p>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-500">
                  {project.description ||
                    'No project description has been added.'}
                </p>
              </div>
            </div>

            <ProjectActions
               project={project}
               projectId={projectId}
            />
          </div>

          <div className="mt-6 grid gap-3 border-t border-white/[0.06] pt-5 sm:grid-cols-3">
            <ProjectMetric
              label="Environments"
              value={environments.length}
              icon={Boxes}
            />

            <ProjectMetric
              label="Feature flags"
              value={flags.length}
              icon={ToggleLeft}
            />

            <ProjectMetric
              label="Created"
              value={formatDate(project.createdAt)}
              icon={Circle}
            />
          </div>
        </header>

        <div className="mt-6 grid gap-6 xl:grid-cols-2">
          <EnvironmentSection
            environments={environments}
            isLoading={environmentsQuery.isPending}
            isError={environmentsQuery.isError}
          />

          <FlagSection
            flags={flags}
            isLoading={flagsQuery.isPending}
            isError={flagsQuery.isError}
          />
        </div>
      </div>
    </main>
  );
}

function ProjectMetric({
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

function EnvironmentSection({
  environments,
  isLoading,
  isError,
}: {
  environments: EnvironmentSummary[];
  isLoading: boolean;
  isError: boolean;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02]">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
        <div>
          <h2 className="text-sm font-medium text-white">
            Environments
          </h2>
          <p className="mt-1 text-xs text-zinc-600">
            Deployment stages for this project
          </p>
        </div>

        <Boxes className="size-4 text-zinc-600" />
      </div>

      <div className="p-3">
        {isLoading && <SectionSkeleton />}

        {isError && (
          <SectionMessage message="Unable to load environments." />
        )}

        {!isLoading &&
          !isError &&
          environments.length === 0 && (
            <SectionMessage message="No environments have been created." />
          )}

        {!isLoading &&
          !isError &&
          environments.map((environment, index) => (
            <EnvironmentRow
              key={environment.id ?? index}
              environment={environment}
            />
          ))}
      </div>
    </section>
  );
}

function EnvironmentRow({
  environment,
}: {
  environment: EnvironmentSummary;
}) {
  const type = environment.type ?? 'development';

  const typeStyles = {
    development:
      'border-blue-400/15 bg-blue-500/10 text-blue-300',
    staging:
      'border-amber-400/15 bg-amber-500/10 text-amber-300',
    production:
      'border-emerald-400/15 bg-emerald-500/10 text-emerald-300',
  };

  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-white/[0.03]">
      <div
        className={`flex size-9 items-center justify-center rounded-xl border ${typeStyles[type]}`}
      >
        <Boxes className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-300">
          {environment.name ?? 'Unnamed environment'}
        </p>

        <p className="mt-1 text-xs capitalize text-zinc-600">
          {type}
        </p>
      </div>

      <div className="text-right">
        <p className="text-xs text-zinc-500">
          {environment.flagCount ?? 0} flags
        </p>

        <p className="mt-1 flex items-center justify-end gap-1 text-[10px] text-zinc-700">
          <KeyRound className="size-3" />
          {environment.apiKeyCount ?? 0} keys
        </p>
      </div>
    </div>
  );
}

function FlagSection({
  flags,
  isLoading,
  isError,
}: {
  flags: FeatureFlagSummary[];
  isLoading: boolean;
  isError: boolean;
}) {
  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02]">
      <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
        <div>
          <h2 className="text-sm font-medium text-white">
            Feature flags
          </h2>
          <p className="mt-1 text-xs text-zinc-600">
            Current release controls
          </p>
        </div>

        <ToggleLeft className="size-4 text-zinc-600" />
      </div>

      <div className="p-3">
        {isLoading && <SectionSkeleton />}

        {isError && (
          <SectionMessage message="Unable to load feature flags." />
        )}

        {!isLoading && !isError && flags.length === 0 && (
          <SectionMessage message="No feature flags have been created." />
        )}

        {!isLoading &&
          !isError &&
          flags.map((flag, index) => (
            <FlagRow
              key={flag.id ?? index}
              flag={flag}
            />
          ))}
      </div>
    </section>
  );
}

function FlagRow({
  flag,
}: {
  flag: FeatureFlagSummary;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-white/[0.03]">
      <div
        className={
          flag.enabled
            ? 'size-2 rounded-full bg-emerald-400 shadow-[0_0_9px_rgba(52,211,153,0.5)]'
            : 'size-2 rounded-full bg-zinc-700'
        }
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-zinc-300">
          {flag.name ?? 'Unnamed flag'}
        </p>

        <p className="mt-1 truncate font-mono text-xs text-zinc-600">
          {flag.key ?? 'no-key'}
        </p>
      </div>

      <span
        className={
          flag.enabled
            ? 'text-xs text-emerald-400'
            : 'text-xs text-zinc-600'
        }
      >
        {flag.enabled ? 'Enabled' : 'Disabled'}
      </span>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-16 rounded-xl bg-white/[0.04]"
        />
      ))}
    </div>
  );
}

function SectionMessage({
  message,
}: {
  message: string;
}) {
  return (
    <div className="py-16 text-center text-sm text-zinc-600">
      {message}
    </div>
  );
}

function ProjectDetailError({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
      <div className="text-center">
        <p className="text-sm text-zinc-300">
          Unable to load this project.
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

function ProjectDetailSkeleton() {
  return (
    <main className="p-5 sm:p-7 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <Skeleton className="h-5 w-32 bg-white/[0.04]" />
        <Skeleton className="mt-6 h-64 rounded-2xl bg-white/[0.04]" />

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