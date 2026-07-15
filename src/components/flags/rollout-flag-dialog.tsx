'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Gauge,
  LoaderCircle,
  RotateCcw,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import { getGetDashboardStatsQueryKey } from '@/api/generated/dashboard/dashboard';
import { getGetFlagsByProjectIdQueryKey } from '@/api/generated/feature-flags/feature-flags';
import type { FeatureFlagSummary } from '@/api/generated/models';
import { getGetProjectByIdQueryKey } from '@/api/generated/projects/projects';
import {
  getGetRolloutStatsQueryKey,
  useGetRolloutStats,
  useRollbackFlag,
  useSetRolloutPercentage,
} from '@/api/generated/rollout/rollout';
import {
  getGetScheduledFlagsQueryKey,
  getGetScheduleStatsQueryKey,
} from '@/api/generated/scheduler/scheduler';
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
import { getApiErrorMessage } from '@/utils/get-api-error-message';

interface RolloutFlagDialogProps {
  flag: FeatureFlagSummary;
  projectId: string;
}

const rolloutPresets = [
  0,
  5,
  10,
  25,
  50,
  75,
  100,
] as const;

export function RolloutFlagDialog({
  flag,
  projectId,
}: RolloutFlagDialogProps) {
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [
    percentageOverride,
    setPercentageOverride,
  ] = useState<number | null>(null);
  const [confirmRollback, setConfirmRollback] =
    useState(false);

  const rolloutQuery = useGetRolloutStats(
    flag.id ?? '',
    {
      query: {
        enabled: open && Boolean(flag.id),
        staleTime: 15 * 1000,
      },
    }
  );

  const updateMutation =
    useSetRolloutPercentage();
  const rollbackMutation = useRollbackFlag();

  const stats = rolloutQuery.data?.data;

  const percentage =
  percentageOverride ??
  stats?.rolloutPercentage ??
  100;

  const isPending =
    updateMutation.isPending ||
    rollbackMutation.isPending;

  const closeDialog = () => {
  setOpen(false);
  setPercentageOverride(null);
  setConfirmRollback(false);
};

const handleOpenChange = (
  nextOpen: boolean
) => {
  if (!nextOpen && isPending) return;

  setOpen(nextOpen);

  if (!nextOpen) {
    setPercentageOverride(null);
    setConfirmRollback(false);
  }
};

  const invalidateRolloutQueries = async () => {
    if (!flag.id) return;

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey:
          getGetRolloutStatsQueryKey(flag.id),
      }),
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
  };

  const saveRollout = async () => {
    if (!flag.id) return;

    if (
      !Number.isInteger(percentage) ||
      percentage < 0 ||
      percentage > 100
    ) {
      toast.error(
        'Rollout percentage must be a whole number between 0 and 100.'
      );
      return;
    }

    try {
      const response =
        await updateMutation.mutateAsync({
          flagId: flag.id,
          data: {
            percentage,
          },
        });

      await invalidateRolloutQueries();

      toast.success(
        response.data?.message ??
          `Rollout updated to ${percentage}%`
      );

      closeDialog();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to update the rollout.'
        )
      );
    }
  };

  const rollbackFlag = async () => {
    if (!flag.id) return;

    try {
      const response =
        await rollbackMutation.mutateAsync({
          flagId: flag.id,
        });

      await Promise.all([
        invalidateRolloutQueries(),
        queryClient.invalidateQueries({
          queryKey:
            getGetScheduledFlagsQueryKey(),
        }),
        queryClient.invalidateQueries({
          queryKey:
            getGetScheduleStatsQueryKey(),
        }),
      ]);

      toast.success(
        response.data?.message ??
          'Feature flag rolled back'
      );

      closeDialog();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to roll back the feature flag.'
        )
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-zinc-600 hover:bg-fuchsia-500/10 hover:text-fuchsia-300"
            disabled={!flag.id}
            title="Configure rollout"
          />
        }
      >
        <Gauge className="size-4" />
        <span className="sr-only">
          Configure rollout
        </span>
      </DialogTrigger>

      <DialogContent className="border border-white/[0.09] bg-[#0d111a] text-white ring-0 sm:max-w-xl">
        {confirmRollback ? (
          <RollbackConfirmation
            flagName={flag.name ?? 'this flag'}
            pending={rollbackMutation.isPending}
            onCancel={() =>
              setConfirmRollback(false)
            }
            onConfirm={rollbackFlag}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                Gradual rollout
              </DialogTitle>

              <DialogDescription className="text-zinc-500">
                Control what percentage of identified
                application users receive{' '}
                {flag.name ?? 'this feature'}.
              </DialogDescription>
            </DialogHeader>

            {rolloutQuery.isPending && (
              <div className="space-y-4 py-4">
                <Skeleton className="h-28 rounded-xl bg-white/[0.04]" />
                <Skeleton className="h-16 rounded-xl bg-white/[0.04]" />
              </div>
            )}

            {rolloutQuery.isError && (
              <div className="my-4 rounded-xl border border-red-400/10 bg-red-500/[0.04] p-4 text-sm text-red-300">
                Unable to load rollout configuration.
              </div>
            )}

            {rolloutQuery.isSuccess && stats && (
              <div className="space-y-6 py-3">
                {!flag.enabled && (
                  <div className="flex gap-3 rounded-xl border border-amber-400/15 bg-amber-500/[0.06] p-4">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300" />

                    <div>
                      <p className="text-xs font-medium text-amber-200">
                        Master flag is disabled
                      </p>

                      <p className="mt-1 text-xs leading-5 text-amber-200/50">
                        The percentage will be saved, but no
                        users receive the feature until the
                        flag is enabled.
                      </p>
                    </div>
                  </div>
                )}

                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs text-zinc-600">
                        Rollout percentage
                      </p>

                      <p className="mt-2 text-3xl font-semibold tracking-tight text-white">
                        {percentage}%
                      </p>
                    </div>

                    <span
                      className={
                        stats.isActive
                          ? 'rounded-full border border-emerald-400/15 bg-emerald-500/10 px-2.5 py-1 text-[10px] text-emerald-300'
                          : 'rounded-full border border-zinc-400/10 bg-zinc-500/10 px-2.5 py-1 text-[10px] text-zinc-500'
                      }
                    >
                      {stats.isActive
                        ? 'Active'
                        : 'Inactive'}
                    </span>
                  </div>

                  <div className="mt-5">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={percentage}
                      aria-label="Rollout percentage"
                      className="h-2 w-full cursor-pointer accent-indigo-500"
                      onChange={(event) =>
                        setPercentageOverride(
                          Number(event.target.value)
                        )
                      }
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-[1fr_100px] items-end gap-4">
                    <div>
                      <Label>Quick milestones</Label>

                      <div className="mt-2 flex flex-wrap gap-2">
                        {rolloutPresets.map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            className={
                              percentage === preset
                                ? 'rounded-lg border border-indigo-400/25 bg-indigo-500/10 px-2.5 py-1.5 text-xs text-indigo-300'
                                : 'rounded-lg border border-white/[0.07] bg-white/[0.02] px-2.5 py-1.5 text-xs text-zinc-600 hover:text-zinc-300'
                            }
                            onClick={() =>
                              setPercentageOverride(preset)
                            }
                          >
                            {preset}%
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`rollout-${flag.id}`}>
                        Exact
                      </Label>

                      <div className="relative">
                        <Input
                          id={`rollout-${flag.id}`}
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          value={percentage}
                          className="border-white/10 bg-black/20 pr-7"
                          onChange={(event) => {
                            const value = Number(
                              event.target.value
                            );

                            setPercentageOverride(
                              Math.max(
                                0,
                                Math.min(100, value)
                              )
                            );
                          }}
                        />

                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600">
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <InformationCard
                    icon={Users}
                    label="Estimated users"
                    value={
                      stats.estimatedUsersAffected === null
                        ? 'Not tracked'
                        : new Intl.NumberFormat('en').format(
                            stats.estimatedUsersAffected
                          )
                    }
                  />

                  <InformationCard
                    icon={Gauge}
                    label="Next milestone"
                    value={
                      stats.nextMilestones[0]
                        ? `${stats.nextMilestones[0].percentage}%`
                        : 'Fully rolled out'
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-4 rounded-xl border border-red-400/10 bg-red-500/[0.025] p-4">
                  <div>
                    <p className="text-xs font-medium text-red-300">
                      Emergency rollback
                    </p>

                    <p className="mt-1 text-xs text-zinc-600">
                      Disable the flag, reset rollout to 0%,
                      and cancel its schedule.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0 border-red-400/20 bg-transparent text-red-300 hover:bg-red-500/10"
                    onClick={() =>
                      setConfirmRollback(true)
                    }
                  >
                    <RotateCcw className="size-3.5" />
                    Roll back
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter className="border-white/[0.07] bg-white/[0.02]">
              <Button
                type="button"
                variant="outline"
                className="border-white/10 bg-transparent"
                disabled={isPending}
                onClick={closeDialog}
              >
                Cancel
              </Button>

              <Button
                type="button"
                className="bg-indigo-500 text-white hover:bg-indigo-400"
                disabled={
                  isPending ||
                  rolloutQuery.isPending ||
                  rolloutQuery.isError
                }
                onClick={saveRollout}
              >
                {updateMutation.isPending && (
                  <LoaderCircle className="size-4 animate-spin" />
                )}
                Save rollout
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function RollbackConfirmation({
  flagName,
  pending,
  onCancel,
  onConfirm,
}: {
  flagName: string;
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="size-5 text-red-400" />
        </div>

        <DialogTitle>
          Emergency rollback?
        </DialogTitle>

        <DialogDescription className="text-zinc-500">
          {flagName} will immediately be disabled for every
          user. Its rollout will be reset to 0%, and any
          scheduled change will be cancelled.
        </DialogDescription>
      </DialogHeader>

      <div className="rounded-xl border border-red-400/10 bg-red-500/[0.04] p-4 text-xs leading-5 text-red-200/60">
        Use this action when the released feature is causing
        errors or unexpected behavior.
      </div>

      <DialogFooter className="border-white/[0.07] bg-white/[0.02]">
        <Button
          type="button"
          variant="outline"
          className="border-white/10 bg-transparent"
          disabled={pending}
          onClick={onCancel}
        >
          Go back
        </Button>

        <Button
          type="button"
          className="bg-red-500 text-white hover:bg-red-400"
          disabled={pending}
          onClick={onConfirm}
        >
          {pending && (
            <LoaderCircle className="size-4 animate-spin" />
          )}
          Confirm rollback
        </Button>
      </DialogFooter>
    </>
  );
}

function InformationCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
      <div className="flex items-center gap-2">
        <Icon className="size-3.5 text-indigo-300" />

        <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-700">
          {label}
        </p>
      </div>

      <p className="mt-3 text-sm font-medium text-zinc-300">
        {value}
      </p>
    </div>
  );
}