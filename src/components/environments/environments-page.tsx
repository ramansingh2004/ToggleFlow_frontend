'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  Boxes,
  FolderKanban,
  KeyRound,
  LoaderCircle,
  Plus,
  Search,
  ToggleLeft,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { getGetDashboardStatsQueryKey } from '@/api/generated/dashboard/dashboard';
import {
  getGetEnvironmentsQueryKey,
  useCreateEnvironment,
  useGetEnvironments,
} from '@/api/generated/environments/environments';
import type { EnvironmentSummary } from '@/api/generated/models';
import { getGetProjectByIdQueryKey } from '@/api/generated/projects/projects';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  createEnvironmentSchema,
  environmentTypes,
  type EnvironmentFormValues,
} from '@/schemas/environment.schema';
import { useUiStore } from '@/store/ui-store';
import { getApiErrorMessage } from '@/utils/get-api-error-message';
import { CompareEnvironmentsDialog } from '@/components/environments/compare-environments-dialog';
import { PromoteFlagsDialog } from '@/components/environments/promote-flags-dialog';

type EnvironmentFilter =
  | 'all'
  | 'development'
  | 'staging'
  | 'production';

export function EnvironmentsPage() {
  const selectedProjectId = useUiStore(
    (state) => state.selectedProjectId
  );

  const [search, setSearch] = useState('');
  const [filter, setFilter] =
    useState<EnvironmentFilter>('all');
  const [createOpen, setCreateOpen] =
    useState(false);

  const environmentsQuery = useGetEnvironments(
    selectedProjectId ?? '',
    {
      query: {
        enabled: Boolean(selectedProjectId),
        staleTime: 60 * 1000,
      },
    }
  );

  const environments =
    environmentsQuery.data?.data ?? [];

  const filteredEnvironments = useMemo(() => {
    const value = search.trim().toLowerCase();

    return environments.filter((environment) => {
      const matchesSearch =
        !value ||
        environment.name?.toLowerCase().includes(value) ||
        environment.description
          ?.toLowerCase()
          .includes(value);

      const matchesType =
        filter === 'all' ||
        environment.type === filter;

      return matchesSearch && matchesType;
    });
  }, [environments, filter, search]);

  if (!selectedProjectId) {
    return <NoProjectSelected />;
  }

  return (
    <main className="p-5 sm:p-7 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-primary">
              Release stages
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground">
              Environments
            </h1>

            <p className="mt-3 text-sm text-muted-foreground">
              Separate development, staging, and production
              configuration.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <PromoteFlagsDialog
              projectId={selectedProjectId}
              environments={environments}
            />

            <CompareEnvironmentsDialog
              projectId={selectedProjectId}
              environments={environments}
            />

            <CreateEnvironmentDialog
              projectId={selectedProjectId}
              open={createOpen}
              onOpenChange={setCreateOpen}
            />
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              placeholder="Search environments..."
              className="h-10 border-border bg-card pl-10"
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="flex overflow-x-auto rounded-xl border border-border bg-card p-1">
            {(
              [
                'all',
                'development',
                'staging',
                'production',
              ] as const
            ).map((value) => (
              <button
                key={value}
                type="button"
                className={
                  filter === value
                    ? 'rounded-lg bg-primary-subtle px-3 py-1.5 text-xs capitalize text-primary'
                    : 'rounded-lg px-3 py-1.5 text-xs capitalize text-muted-foreground hover:text-foreground-secondary'
                }
                onClick={() => setFilter(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6">
          {environmentsQuery.isPending && (
            <EnvironmentSkeleton />
          )}

          {environmentsQuery.isError && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive-subtle py-16 text-center text-sm text-muted-foreground">
              Unable to load environments.
            </div>
          )}

          {environmentsQuery.isSuccess &&
            environments.length === 0 && (
              <EmptyEnvironments
                onCreate={() => setCreateOpen(true)}
              />
            )}

          {environmentsQuery.isSuccess &&
            environments.length > 0 &&
            filteredEnvironments.length === 0 && (
              <div className="rounded-2xl border border-border bg-card py-16 text-center text-sm text-muted-foreground">
                No environments match the current filters.
              </div>
            )}

          {filteredEnvironments.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredEnvironments.map(
                (environment, index) => (
                  <EnvironmentCard
                    key={environment.id ?? index}
                    environment={environment}
                  />
                )
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function EnvironmentCard({
  environment,
}: {
  environment: EnvironmentSummary;
}) {
  const type =
    environment.type ?? 'development';

  const styles = {
    development: {
      border: 'hover:border-border',
      icon: 'border-border bg-surface-elevated text-foreground-secondary',
      badge:
        'border-border bg-surface-elevated text-foreground-secondary',
    },
    staging: {
      border: 'hover:border-warning/30',
      icon: 'border-warning/30 bg-warning-subtle text-warning',
      badge:
        'border-warning/30 bg-warning-subtle text-warning',
    },
    production: {
      border: 'hover:border-success/30',
      icon: 'border-success/30 bg-success-subtle text-success',
      badge:
        'border-success/30 bg-success-subtle text-success',
    },
  };

  const content = (
    <>
      <div className="flex items-start justify-between">
        <div
          className={`flex size-11 items-center justify-center rounded-xl border ${styles[type].icon}`}
        >
          <Boxes className="size-5" />
        </div>

        <span
          className={`rounded-full border px-2.5 py-1 text-[10px] font-medium capitalize ${styles[type].badge}`}
        >
          {type}
        </span>
      </div>

      <h2 className="mt-5 truncate text-base font-medium text-foreground">
        {environment.name ?? 'Unnamed environment'}
      </h2>

      <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
        {environment.description ||
          'No environment description has been added.'}
      </p>

      <div className="mt-6 flex items-center gap-5 border-t border-border pt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-2">
          <ToggleLeft className="size-4" />
          {environment.flagCount ?? 0} flags
        </span>

        <span className="flex items-center gap-2">
          <KeyRound className="size-4" />
          {environment.apiKeyCount ?? 0} keys
        </span>
      </div>
    </>
  );

  if (!environment.id) {
    return (
      <article className="rounded-2xl border border-border bg-card p-5">
        {content}
      </article>
    );
  }

  return (
    <Link
      href={`/environments/${environment.id}`}
      className={`rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:bg-surface-elevated ${styles[type].border}`}
    >
      {content}
    </Link>
  );
}

interface CreateEnvironmentDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateEnvironmentDialog({
  projectId,
  open,
  onOpenChange,
}: CreateEnvironmentDialogProps) {
  const queryClient = useQueryClient();
  const createMutation = useCreateEnvironment();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EnvironmentFormValues>({
    resolver: zodResolver(createEnvironmentSchema),
    defaultValues: {
      name: '',
      type: 'development',
      description: '',
    },
  });

  const selectedType = watch('type');

  const onSubmit = async (
    values: EnvironmentFormValues
  ) => {
    try {
      await createMutation.mutateAsync({
        projectId,
        data: {
          name: values.name.trim(),
          type: values.type,
          description:
            values.description.trim() || null,
        },
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            getGetEnvironmentsQueryKey(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey:
            getGetProjectByIdQueryKey(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey: getGetDashboardStatsQueryKey(),
        }),
      ]);

      toast.success('Environment created');
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to create the environment.'
        )
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && createMutation.isPending) return;

        onOpenChange(nextOpen);

        if (!nextOpen) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button className="h-9 bg-primary px-4 text-primary-foreground hover:bg-primary-hover" />
        }
      >
        <Plus className="size-4" />
        New environment
      </DialogTrigger>

      <DialogContent className="border border-border bg-popover text-foreground ring-0 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create environment</DialogTitle>

          <DialogDescription className="text-muted-foreground">
            Add a deployment stage to the selected project.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-5 py-3">
            <div className="space-y-2">
              <Label htmlFor="environment-name">
                Name
              </Label>

              <Input
                id="environment-name"
                placeholder="Production"
                className="border-border bg-card"
                {...register('name')}
              />

              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Type</Label>

              <Select
                value={selectedType}
                onValueChange={(value) => {
                  if (
                    value &&
                    environmentTypes.includes(
                      value as EnvironmentFormValues['type']
                    )
                  ) {
                    setValue(
                      'type',
                      value as EnvironmentFormValues['type'],
                      { shouldValidate: true }
                    );
                  }
                }}
              >
                <SelectTrigger className="h-10 w-full border-border bg-card">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent className="border border-border bg-popover text-foreground">
                  {environmentTypes.map((type) => (
                    <SelectItem
                      key={type}
                      value={type}
                      className="capitalize focus:bg-surface-elevated"
                    >
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="environment-description">
                Description
              </Label>

              <Textarea
                id="environment-description"
                rows={3}
                placeholder="Main customer-facing environment..."
                className="resize-none border-border bg-card"
                {...register('description')}
              />

              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="border-border bg-card">
            <Button
              type="button"
              variant="outline"
              className="border-border bg-transparent"
              disabled={createMutation.isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary-hover"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending && (
                <LoaderCircle className="size-4 animate-spin" />
              )}
              Create environment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NoProjectSelected() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
      <div className="max-w-sm text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary-subtle">
          <FolderKanban className="size-6 text-primary" />
        </div>

        <h1 className="mt-5 text-lg font-medium text-foreground">
          Select a project
        </h1>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Choose a project from the sidebar before managing
          environments.
        </p>

        <Link
          href="/projects"
          className="mt-6 inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          View projects
        </Link>
      </div>
    </main>
  );
}

function EmptyEnvironments({
  onCreate,
}: {
  onCreate: () => void;
}) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary-subtle">
        <Boxes className="size-6 text-primary" />
      </div>

      <h2 className="mt-5 text-base font-medium text-foreground">
        Create your first environment
      </h2>

      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        Start with development, then add staging and
        production as your release process grows.
      </p>

      <Button
        className="mt-6 bg-primary text-primary-foreground hover:bg-primary-hover"
        onClick={onCreate}
      >
        <Plus className="size-4" />
        New environment
      </Button>
    </div>
  );
}

function EnvironmentSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-64 rounded-2xl bg-surface-elevated"
        />
      ))}
    </div>
  );
}