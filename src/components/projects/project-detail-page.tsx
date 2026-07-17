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
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground-secondary"
        >
          <ArrowLeft className="size-4" />
          Back to projects
        </Link>

        <header className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/30 bg-primary-subtle">
                <FolderKanban className="size-5 text-primary" />
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
                    {project.name ?? 'Untitled project'}
                  </h1>

                  <span
                    className={
                      project.isActive
                        ? 'rounded-full border border-success/30 bg-success-subtle px-2.5 py-1 text-[10px] font-medium text-success'
                        : 'rounded-full border border-border bg-surface-elevated px-2.5 py-1 text-[10px] font-medium text-muted-foreground'
                    }
                  >
                    {project.isActive
                      ? 'Active'
                      : 'Inactive'}
                  </span>
                </div>

                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {project.slug ?? projectId}
                </p>

                <p className="mt-4 max-w-2xl text-sm leading-6 text-muted-foreground">
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

          <div className="mt-6 grid gap-3 border-t border-border pt-5 sm:grid-cols-3">
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
    <section className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-medium text-foreground">
            Environments
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Deployment stages for this project
          </p>
        </div>

        <Boxes className="size-4 text-muted-foreground" />
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
      'border-border bg-surface-elevated text-foreground-secondary',
    staging:
      'border-warning/30 bg-warning-subtle text-warning',
    production:
      'border-success/30 bg-success-subtle text-success',
  };

  return (
    <div className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-card">
      <div
        className={`flex size-9 items-center justify-center rounded-xl border ${typeStyles[type]}`}
      >
        <Boxes className="size-4" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground-secondary">
          {environment.name ?? 'Unnamed environment'}
        </p>

        <p className="mt-1 text-xs capitalize text-muted-foreground">
          {type}
        </p>
      </div>

      <div className="text-right">
        <p className="text-xs text-muted-foreground">
          {environment.flagCount ?? 0} flags
        </p>

        <p className="mt-1 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
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
    <section className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-medium text-foreground">
            Feature flags
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Current release controls
          </p>
        </div>

        <ToggleLeft className="size-4 text-muted-foreground" />
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
    <div className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-card">
      <div
        className={
          flag.enabled
            ? 'size-2 rounded-full bg-success'
            : 'size-2 rounded-full bg-surface-elevated'
        }
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground-secondary">
          {flag.name ?? 'Unnamed flag'}
        </p>

        <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
          {flag.key ?? 'no-key'}
        </p>
      </div>

      <span
        className={
          flag.enabled
            ? 'text-xs text-success'
            : 'text-xs text-muted-foreground'
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
          className="h-16 rounded-xl bg-surface-elevated"
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
    <div className="py-16 text-center text-sm text-muted-foreground">
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
        <p className="text-sm text-foreground-secondary">
          Unable to load this project.
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

function ProjectDetailSkeleton() {
  return (
    <main className="p-5 sm:p-7 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <Skeleton className="h-5 w-32 bg-surface-elevated" />
        <Skeleton className="mt-6 h-64 rounded-2xl bg-surface-elevated" />

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
