'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CalendarClock,
  Clock3,
  LoaderCircle,
  Power,
  PowerOff,
  Timer,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import type { ScheduledFlag } from '@/api/generated/models';
import {
  getGetScheduledFlagsQueryKey,
  getGetScheduleStatsQueryKey,
  useCancelSchedule,
  useGetScheduledFlags,
  useGetScheduleStats,
} from '@/api/generated/scheduler/scheduler';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getApiErrorMessage } from '@/utils/get-api-error-message';

export function SchedulerPage() {
  const schedulesQuery = useGetScheduledFlags({
    query: {
      staleTime: 15 * 1000,
      refetchInterval: 30 * 1000,
    },
  });

  const statsQuery = useGetScheduleStats({
    query: {
      staleTime: 15 * 1000,
      refetchInterval: 30 * 1000,
    },
  });

  const schedules = schedulesQuery.data?.data ?? [];
  const stats = statsQuery.data?.data;

  return (
    <main className="p-5 sm:p-7 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div>
          <p className="text-sm font-medium text-primary">
            Automation
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground">
            Scheduled changes
          </h1>

          <p className="mt-3 text-sm text-muted-foreground">
            Review and cancel upcoming feature-flag state
            changes across your projects.
          </p>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total scheduled"
            value={stats?.total ?? schedules.length}
            icon={CalendarClock}
          />

          <StatCard
            label="Next hour"
            value={stats?.inNextHour ?? 0}
            icon={Timer}
          />

          <StatCard
            label="Next 24 hours"
            value={stats?.inNextDay ?? 0}
            icon={Clock3}
          />

          <StatCard
            label="Next 7 days"
            value={stats?.inNextWeek ?? 0}
            icon={CalendarClock}
          />
        </div>

        <section className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-foreground">
                Upcoming changes
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Times are displayed in your local timezone.
              </p>
            </div>

            <Link
              href="/flags"
              className="text-xs text-primary transition-colors hover:text-primary"
            >
              View feature flags
            </Link>
          </div>

          {(schedulesQuery.isPending ||
            statsQuery.isPending) && (
            <SchedulerSkeleton />
          )}

          {schedulesQuery.isError && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive-subtle py-16 text-center text-sm text-muted-foreground">
              Unable to load scheduled changes.
            </div>
          )}

          {schedulesQuery.isSuccess &&
            schedules.length === 0 && (
              <EmptySchedules />
            )}

          {schedules.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="hidden grid-cols-[1.3fr_1fr_130px_1fr_60px] border-b border-border px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground lg:grid">
                <span>Feature flag</span>
                <span>Project</span>
                <span>Action</span>
                <span>Scheduled time</span>
                <span />
              </div>

              <div className="divide-y divide-border">
                {schedules.map((schedule) => (
                  <ScheduleRow
                    key={schedule.flagId}
                    schedule={schedule}
                  />
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ScheduleRow({
  schedule,
}: {
  schedule: ScheduledFlag;
}) {
  const enabling = schedule.action === 'enable';
  const ActionIcon = enabling ? Power : PowerOff;

  return (
    <div className="grid gap-4 px-5 py-4 lg:grid-cols-[1.3fr_1fr_130px_1fr_60px] lg:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={
            enabling
              ? 'flex size-9 shrink-0 items-center justify-center rounded-xl border border-success/30 bg-success-subtle'
              : 'flex size-9 shrink-0 items-center justify-center rounded-xl border border-warning/30 bg-warning-subtle'
          }
        >
          <ActionIcon
            className={
              enabling
                ? 'size-4 text-success'
                : 'size-4 text-warning'
            }
          />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {schedule.flagName}
          </p>

          <code className="mt-1 block truncate text-[11px] text-muted-foreground">
            {schedule.flagKey}
          </code>
        </div>
      </div>

      <div>
        <p className="text-xs text-foreground-secondary">
          {schedule.projectName}
        </p>

        <p className="mt-1 text-[10px] text-muted-foreground">
          Currently{' '}
          {schedule.currentlyEnabled
            ? 'enabled'
            : 'disabled'}
        </p>
      </div>

      <div>
        <span
          className={
            enabling
              ? 'rounded-full border border-success/30 bg-success-subtle px-2.5 py-1 text-[10px] text-success'
              : 'rounded-full border border-warning/30 bg-warning-subtle px-2.5 py-1 text-[10px] text-warning'
          }
        >
          {enabling ? 'Enable' : 'Disable'}
        </span>
      </div>

      <div>
        <p className="text-xs text-foreground-secondary">
          {formatDateTime(schedule.scheduledAt)}
        </p>

        <p className="mt-1 text-[10px] text-primary">
          {formatTimeUntil(schedule.scheduledAt)}
        </p>
      </div>

      <div className="flex justify-end">
        <CancelScheduleDialog schedule={schedule} />
      </div>
    </div>
  );
}

function CancelScheduleDialog({
  schedule,
}: {
  schedule: ScheduledFlag;
}) {
  const queryClient = useQueryClient();
  const cancelMutation = useCancelSchedule();
  const [open, setOpen] = useState(false);

  const cancelSchedule = async () => {
    try {
      await cancelMutation.mutateAsync({
        flagId: schedule.flagId,
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            getGetScheduledFlagsQueryKey(),
        }),
        queryClient.invalidateQueries({
          queryKey:
            getGetScheduleStatsQueryKey(),
        }),
      ]);

      toast.success('Scheduled change cancelled');
      setOpen(false);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to cancel the scheduled change.'
        )
      );
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && cancelMutation.isPending) return;
        setOpen(nextOpen);
      }}
    >
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
          />
        }
      >
        <Trash2 className="size-4" />
        <span className="sr-only">
          Cancel scheduled change
        </span>
      </AlertDialogTrigger>

      <AlertDialogContent className="border border-border bg-popover text-foreground ring-0">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-warning-subtle">
            <AlertTriangle className="text-warning" />
          </AlertDialogMedia>

          <AlertDialogTitle>
            Cancel this scheduled change?
          </AlertDialogTitle>

          <AlertDialogDescription className="text-muted-foreground">
            {schedule.flagName} will no longer be{' '}
            {schedule.action === 'enable'
              ? 'enabled'
              : 'disabled'}{' '}
            at the selected time.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="border-border bg-card">
          <AlertDialogCancel
            className="border-border bg-transparent"
            disabled={cancelMutation.isPending}
          >
            Keep schedule
          </AlertDialogCancel>

          <AlertDialogAction
            variant="destructive"
            disabled={cancelMutation.isPending}
            onClick={cancelSchedule}
          >
            {cancelMutation.isPending && (
              <LoaderCircle className="size-4 animate-spin" />
            )}
            Cancel schedule
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>

        <Icon className="size-4 text-primary" />
      </div>

      <p className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
        {new Intl.NumberFormat('en').format(value)}
      </p>
    </div>
  );
}

function EmptySchedules() {
  return (
    <div className="flex min-h-[380px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 text-center">
      <CalendarClock className="size-8 text-primary" />

      <h2 className="mt-5 text-base font-medium text-foreground">
        No scheduled changes
      </h2>

      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        Schedule a future enable or disable action from one of
        your feature flags.
      </p>

      <Link
        href="/flags"
        className="mt-6 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm text-primary-foreground hover:bg-primary-hover"
      >
        View feature flags
      </Link>
    </div>
  );
}

function SchedulerSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-20 rounded-xl bg-surface-elevated"
        />
      ))}
    </div>
  );
}

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

function formatTimeUntil(value: string): string {
  const target = new Date(value).getTime();

  if (Number.isNaN(target)) {
    return 'Unknown';
  }

  const seconds = Math.max(
    0,
    Math.floor((target - Date.now()) / 1000)
  );

  if (seconds === 0) {
    return 'Processing soon';
  }

  const days = Math.floor(seconds / 86400);

  if (days > 0) {
    return `in ${days} ${days === 1 ? 'day' : 'days'}`;
  }

  const hours = Math.floor(seconds / 3600);

  if (hours > 0) {
    return `in ${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }

  const minutes = Math.max(
    1,
    Math.floor(seconds / 60)
  );

  return `in ${minutes} ${
    minutes === 1 ? 'minute' : 'minutes'
  }`;
}