'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  Flag,
  FolderKanban,
  LoaderCircle,
  Plus,
  Search,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { getGetDashboardStatsQueryKey } from '@/api/generated/dashboard/dashboard';
import {
  getGetFlagsByProjectIdQueryKey,
  useCreateFlag,
  useDisableFlag,
  useEnableFlag,
  useGetFlagsByProjectId,
} from '@/api/generated/feature-flags/feature-flags';
import type { FeatureFlagSummary } from '@/api/generated/models';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  createFlagSchema,
  type CreateFlagFormValues,
} from '@/schemas/flag.schema';
import { useUiStore } from '@/store/ui-store';
import { getApiErrorMessage } from '@/utils/get-api-error-message';
import { ScheduleFlagDialog } from '@/components/flags/schedule-flag-dialog';
import { RolloutFlagDialog } from '@/components/flags/rollout-flag-dialog';
import { useGetProjectSegments } from '@/api/generated/segments/segments';
import { SegmentPicker } from '@/components/flags/segment-picker';
import { SegmentTargetingDialog } from '@/components/flags/segment-targeting-dialog';

type FlagFilter = 'all' | 'enabled' | 'disabled';

export function FlagsPage() {
  const selectedProjectId = useUiStore(
    (state) => state.selectedProjectId
  );

  const [search, setSearch] = useState('');
  const [filter, setFilter] =
    useState<FlagFilter>('all');
  const [isCreateOpen, setIsCreateOpen] =
    useState(false);

  const flagsQuery = useGetFlagsByProjectId(
    selectedProjectId ?? '',
    {
      query: {
        enabled: Boolean(selectedProjectId),
        staleTime: 30 * 1000,
      },
    }
  );

  const flags = flagsQuery.data?.data ?? [];

  const filteredFlags = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return flags.filter((flag) => {
      const matchesSearch =
        !searchValue ||
        flag.name?.toLowerCase().includes(searchValue) ||
        flag.key?.toLowerCase().includes(searchValue);

      const matchesFilter =
        filter === 'all' ||
        (filter === 'enabled' && flag.enabled) ||
        (filter === 'disabled' && !flag.enabled);

      return matchesSearch && matchesFilter;
    });
  }, [filter, flags, search]);

  if (!selectedProjectId) {
    return <NoProjectSelected />;
  }

  return (
    <main className="p-5 sm:p-7 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-primary">
              Release control
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground">
              Feature flags
            </h1>

            <p className="mt-3 text-sm text-muted-foreground">
              Enable and disable features without deploying
              new code.
            </p>
          </div>

          <CreateFlagDialog
            projectId={selectedProjectId}
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
          />
        </div>

        <div className="mt-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              placeholder="Search by name or key..."
              className="h-10 border-border bg-card pl-10"
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="flex rounded-xl border border-border bg-card p-1">
            {(['all', 'enabled', 'disabled'] as const).map(
              (value) => (
                <button
                  key={value}
                  type="button"
                  className={
                    filter === value
                      ? 'rounded-lg bg-primary-subtle px-3 py-1.5 text-xs capitalize text-primary'
                      : 'rounded-lg px-3 py-1.5 text-xs capitalize text-muted-foreground transition-colors hover:text-foreground-secondary'
                  }
                  onClick={() => setFilter(value)}
                >
                  {value}
                </button>
              )
            )}
          </div>
        </div>

        <div className="mt-6">
          {flagsQuery.isPending && <FlagsSkeleton />}

          {flagsQuery.isError && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive-subtle px-6 py-16 text-center text-sm text-foreground-secondary">
              Unable to load feature flags.
            </div>
          )}

          {flagsQuery.isSuccess && flags.length === 0 && (
            <EmptyFlags
              onCreate={() => setIsCreateOpen(true)}
            />
          )}

          {flagsQuery.isSuccess &&
            flags.length > 0 &&
            filteredFlags.length === 0 && (
              <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center text-sm text-muted-foreground">
                No flags match the current filters.
              </div>
            )}

          {filteredFlags.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="hidden grid-cols-[1fr_1fr_120px] border-b border-border px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground md:grid">
                <span>Flag</span>
                <span>Key</span>
                <span className="text-right">Status</span>
              </div>

              <div className="divide-y divide-border">
                {filteredFlags.map((flag, index) => (
                  <FlagRow
                    key={flag.id ?? index}
                    flag={flag}
                    projectId={selectedProjectId}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function FlagRow({
  flag,
  projectId,
}: {
  flag: FeatureFlagSummary;
  projectId: string;
}) {
  const queryClient = useQueryClient();

  const [pendingValue, setPendingValue] =
    useState<boolean | null>(null);

  const enableMutation = useEnableFlag();
  const disableMutation = useDisableFlag();

  const isPending =
    enableMutation.isPending ||
    disableMutation.isPending;

  const displayedValue =
    pendingValue ?? Boolean(flag.enabled);

  const handleToggle = async (checked: boolean) => {
    if (!flag.id || isPending) return;

    setPendingValue(checked);

    try {
      if (checked) {
        await enableMutation.mutateAsync({
          flagId: flag.id,
        });
      } else {
        await disableMutation.mutateAsync({
          flagId: flag.id,
        });
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            getGetFlagsByProjectIdQueryKey(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey:
            getGetProjectByIdQueryKey(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey: getGetDashboardStatsQueryKey(),
        }),
      ]);

      toast.success(
        checked ? 'Feature enabled' : 'Feature disabled'
      );
    } catch (error) {
      setPendingValue(null);

      toast.error(
        getApiErrorMessage(
          error,
          'Unable to update the feature flag.'
        )
      );
    } finally {
      setPendingValue(null);
    }
  };

  return (
    <div className="grid gap-4 px-5 py-4 transition-colors hover:bg-card md:grid-cols-[1fr_1fr_120px] md:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={
            displayedValue
              ? 'flex size-9 shrink-0 items-center justify-center rounded-xl border border-success/30 bg-success-subtle'
              : 'flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card'
          }
        >
          <Flag
            className={
              displayedValue
                ? 'size-4 text-success'
                : 'size-4 text-muted-foreground'
            }
          />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {flag.name ?? 'Unnamed flag'}
          </p>

          {(flag.segmentIds?.length ?? 0) > 0 && (
            <p className="mt-1 text-[11px] text-primary">
              {flag.segmentIds?.length}{' '}
              {flag.segmentIds?.length === 1
                ? 'target segment'
                : 'target segments'}
            </p>
          )}

          <p className="mt-1 text-xs text-muted-foreground md:hidden">
            {displayedValue ? 'Enabled' : 'Disabled'}
          </p>
        </div>
      </div>

      <code className="truncate rounded-lg bg-card px-2.5 py-1.5 text-xs text-muted-foreground">
        {flag.key ?? 'no_key'}
      </code>

      <div className="flex items-center justify-between gap-3 md:justify-end">
        <span
          className={
            displayedValue
              ? 'text-xs text-success'
              : 'text-xs text-muted-foreground'
          }
        >
          {displayedValue ? 'On' : 'Off'}
        </span>

        <SegmentTargetingDialog
          flag={flag}
          projectId={projectId}
        />

        <RolloutFlagDialog
          flag={flag}
          projectId={projectId}
        />

        <ScheduleFlagDialog
          flag={flag}
          projectId={projectId}
        />

        <Switch
          checked={displayedValue}
          disabled={!flag.id || isPending}
          className="data-checked:bg-primary"
          onCheckedChange={handleToggle}
        />
      </div>
    </div>
  );
}

interface CreateFlagDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateFlagDialog({
  projectId,
  open,
  onOpenChange,
}: CreateFlagDialogProps) {
  const queryClient = useQueryClient();
  const createMutation = useCreateFlag();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateFlagFormValues>({
    resolver: zodResolver(createFlagSchema),
    defaultValues: {
      name: '',
      key: '',
      description: '',
      segmentIds: [],
    },
  });

  const handleNameChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    register('name').onChange(event);

    setValue(
      'key',
      event.target.value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, ''),
      {
        shouldValidate: true,
      }
    );
  };

  const segmentsQuery = useGetProjectSegments(
  projectId,
  {
    query: {
      enabled: open,
      staleTime: 30 * 1000,
    },
  }
);

const segments = segmentsQuery.data?.data ?? [];
const selectedSegmentIds = watch('segmentIds');

  const onSubmit = async (
    values: CreateFlagFormValues
  ) => {
    try {
      await createMutation.mutateAsync({
        projectId,
        data: {
          name: values.name.trim(),
          key: values.key.trim(),
          description:
            values.description.trim() || null,
          segmentIds: values.segmentIds,
        },
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            getGetFlagsByProjectIdQueryKey(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey:
            getGetProjectByIdQueryKey(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey: getGetDashboardStatsQueryKey(),
        }),
      ]);

      toast.success('Feature flag created');
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to create the feature flag.'
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
        New flag
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto border border-border bg-popover text-foreground ring-0 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create feature flag</DialogTitle>

          <DialogDescription className="text-muted-foreground">
            The flag will be disabled by default.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-5 py-3">
            <div className="space-y-2">
              <Label htmlFor="flag-name">Name</Label>

              <Input
                id="flag-name"
                placeholder="Dark mode"
                className="border-border bg-card"
                {...register('name')}
                onChange={handleNameChange}
              />

              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="flag-key">Flag key</Label>

              <Input
                id="flag-key"
                placeholder="dark_mode"
                className="font-mono border-border bg-card"
                {...register('key')}
              />

              {errors.key && (
                <p className="text-xs text-destructive">
                  {errors.key.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="flag-description">
                Description
              </Label>

              <Textarea
                id="flag-description"
                rows={3}
                placeholder="Controls the new dark theme..."
                className="resize-none border-border bg-card"
                {...register('description')}
              />

              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>

            {/* ADD: Segment targeting */}
<div className="space-y-3">
  <div>
    <Label>Target segments</Label>

    <p className="mt-1 text-xs leading-5 text-muted-foreground">
      Leave all users selected or restrict this flag to
      users matching one or more segments.
    </p>
  </div>

  <div className="max-h-64 overflow-y-auto pr-1">
    <SegmentPicker
      segments={segments}
      selectedIds={selectedSegmentIds}
      loading={segmentsQuery.isPending}
      disabled={createMutation.isPending}
      onChange={(segmentIds) =>
        setValue(
          'segmentIds',
          segmentIds,
          {
            shouldDirty: true,
            shouldValidate: true,
          }
        )
      }
    />
  </div>

  {segmentsQuery.isError && (
    <p className="text-xs text-destructive">
      Unable to load project segments.
    </p>
  )}

  {errors.segmentIds && (
    <p className="text-xs text-destructive">
      {errors.segmentIds.message}
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
              onClick={() => {
                reset();
                onOpenChange(false)}}
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
              Create flag
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
          feature flags.
        </p>

        <Link
          href="/projects"
          className="mt-6 inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          View projects
        </Link>
      </div>
    </main>
  );
}

function EmptyFlags({
  onCreate,
}: {
  onCreate: () => void;
}) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary-subtle">
        <Flag className="size-6 text-primary" />
      </div>

      <h2 className="mt-5 text-base font-medium text-foreground">
        Create your first feature flag
      </h2>

      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        Add a release control and safely enable it whenever
        you are ready.
      </p>

      <Button
        className="mt-6 bg-primary text-primary-foreground hover:bg-primary-hover"
        onClick={onCreate}
      >
        <Plus className="size-4" />
        New flag
      </Button>
    </div>
  );
}

function FlagsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-20 rounded-xl bg-surface-elevated"
        />
      ))}
    </div>
  );
}