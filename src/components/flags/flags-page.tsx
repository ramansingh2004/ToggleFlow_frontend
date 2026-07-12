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
            <p className="text-sm font-medium text-indigo-300">
              Release control
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">
              Feature flags
            </h1>

            <p className="mt-3 text-sm text-zinc-500">
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
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-600" />

            <Input
              value={search}
              placeholder="Search by name or key..."
              className="h-10 border-white/[0.08] bg-white/[0.025] pl-10"
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="flex rounded-xl border border-white/[0.07] bg-white/[0.02] p-1">
            {(['all', 'enabled', 'disabled'] as const).map(
              (value) => (
                <button
                  key={value}
                  type="button"
                  className={
                    filter === value
                      ? 'rounded-lg bg-white/[0.08] px-3 py-1.5 text-xs capitalize text-zinc-200'
                      : 'rounded-lg px-3 py-1.5 text-xs capitalize text-zinc-600 transition-colors hover:text-zinc-300'
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
            <div className="rounded-2xl border border-red-400/10 bg-red-500/[0.03] px-6 py-16 text-center text-sm text-zinc-400">
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
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-6 py-16 text-center text-sm text-zinc-600">
                No flags match the current filters.
              </div>
            )}

          {filteredFlags.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
              <div className="hidden grid-cols-[1fr_1fr_120px] border-b border-white/[0.07] px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-700 md:grid">
                <span>Flag</span>
                <span>Key</span>
                <span className="text-right">Status</span>
              </div>

              <div className="divide-y divide-white/[0.06]">
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
    <div className="grid gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02] md:grid-cols-[1fr_1fr_120px] md:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={
            displayedValue
              ? 'flex size-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/15 bg-emerald-500/10'
              : 'flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03]'
          }
        >
          <Flag
            className={
              displayedValue
                ? 'size-4 text-emerald-300'
                : 'size-4 text-zinc-600'
            }
          />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-200">
            {flag.name ?? 'Unnamed flag'}
          </p>

          <p className="mt-1 text-xs text-zinc-700 md:hidden">
            {displayedValue ? 'Enabled' : 'Disabled'}
          </p>
        </div>
      </div>

      <code className="truncate rounded-lg bg-white/[0.035] px-2.5 py-1.5 text-xs text-zinc-500">
        {flag.key ?? 'no_key'}
      </code>

      <div className="flex items-center justify-between gap-3 md:justify-end">
        <span
          className={
            displayedValue
              ? 'text-xs text-emerald-400'
              : 'text-xs text-zinc-600'
          }
        >
          {displayedValue ? 'On' : 'Off'}
        </span>

        <Switch
          checked={displayedValue}
          disabled={!flag.id || isPending}
          className="data-checked:bg-indigo-500"
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
    formState: { errors },
  } = useForm<CreateFlagFormValues>({
    resolver: zodResolver(createFlagSchema),
    defaultValues: {
      name: '',
      key: '',
      description: '',
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
          <Button className="h-9 bg-indigo-500 px-4 text-white hover:bg-indigo-400" />
        }
      >
        <Plus className="size-4" />
        New flag
      </DialogTrigger>

      <DialogContent className="border border-white/[0.09] bg-[#0d111a] text-white ring-0 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create feature flag</DialogTitle>

          <DialogDescription className="text-zinc-500">
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
                className="border-white/10 bg-white/[0.035]"
                {...register('name')}
                onChange={handleNameChange}
              />

              {errors.name && (
                <p className="text-xs text-red-400">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="flag-key">Flag key</Label>

              <Input
                id="flag-key"
                placeholder="dark_mode"
                className="font-mono border-white/10 bg-white/[0.035]"
                {...register('key')}
              />

              {errors.key && (
                <p className="text-xs text-red-400">
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
                className="resize-none border-white/10 bg-white/[0.035]"
                {...register('description')}
              />

              {errors.description && (
                <p className="text-xs text-red-400">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="border-white/[0.07] bg-white/[0.02]">
            <Button
              type="button"
              variant="outline"
              className="border-white/10 bg-transparent"
              disabled={createMutation.isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="bg-indigo-500 text-white hover:bg-indigo-400"
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
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-indigo-400/15 bg-indigo-500/10">
          <FolderKanban className="size-6 text-indigo-300" />
        </div>

        <h1 className="mt-5 text-lg font-medium text-white">
          Select a project
        </h1>

        <p className="mt-2 text-sm leading-6 text-zinc-600">
          Choose a project from the sidebar before managing
          feature flags.
        </p>

        <Link
          href="/projects"
          className="mt-6 inline-flex h-9 items-center justify-center rounded-lg bg-indigo-500 px-4 text-sm font-medium text-white transition-colors hover:bg-indigo-400"
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
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.015] px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-indigo-400/15 bg-indigo-500/10">
        <Flag className="size-6 text-indigo-300" />
      </div>

      <h2 className="mt-5 text-base font-medium text-white">
        Create your first feature flag
      </h2>

      <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-600">
        Add a release control and safely enable it whenever
        you are ready.
      </p>

      <Button
        className="mt-6 bg-indigo-500 text-white hover:bg-indigo-400"
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
          className="h-20 rounded-xl bg-white/[0.04]"
        />
      ))}
    </div>
  );
}