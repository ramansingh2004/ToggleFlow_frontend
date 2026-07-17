'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock,
  LoaderCircle,
  Power,
  PowerOff,
} from 'lucide-react';
import { toast } from 'sonner';

import { getGetFlagsByProjectIdQueryKey } from '@/api/generated/feature-flags/feature-flags';
import type { FeatureFlagSummary } from '@/api/generated/models';
import {
  getGetScheduledFlagsQueryKey,
  getGetScheduleStatsQueryKey,
  useScheduleDisableFlag,
  useScheduleEnableFlag,
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
import { getApiErrorMessage } from '@/utils/get-api-error-message';

type ScheduledAction = 'enable' | 'disable';

interface ScheduleFlagDialogProps {
  flag: FeatureFlagSummary;
  projectId: string;
}

export function ScheduleFlagDialog({
  flag,
  projectId,
}: ScheduleFlagDialogProps) {
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [action, setAction] =
    useState<ScheduledAction>(
      flag.enabled ? 'disable' : 'enable'
    );
  const [scheduledAt, setScheduledAt] = useState(
    getDefaultScheduleTime()
  );

  const enableMutation = useScheduleEnableFlag();
  const disableMutation = useScheduleDisableFlag();

  const isPending =
    enableMutation.isPending ||
    disableMutation.isPending;

  const resetForm = () => {
    setAction(flag.enabled ? 'disable' : 'enable');
    setScheduledAt(getDefaultScheduleTime());
  };

  const scheduleChange = async () => {
    if (!flag.id) return;

    if (!scheduledAt) {
      toast.error('Select a date and time.');
      return;
    }

    const localDate = new Date(scheduledAt);

    if (Number.isNaN(localDate.getTime())) {
      toast.error('Select a valid date and time.');
      return;
    }

    if (localDate.getTime() <= Date.now()) {
      toast.error(
        'The scheduled time must be in the future.'
      );
      return;
    }

    const data = {
      // datetime-local is interpreted in the user's local
      // timezone and then converted to UTC for the API.
      scheduledAt: localDate.toISOString(),
    };

    try {
      if (action === 'enable') {
        await enableMutation.mutateAsync({
          flagId: flag.id,
          data,
        });
      } else {
        await disableMutation.mutateAsync({
          flagId: flag.id,
          data,
        });
      }

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            getGetScheduledFlagsQueryKey(),
        }),
        queryClient.invalidateQueries({
          queryKey:
            getGetScheduleStatsQueryKey(),
        }),
        queryClient.invalidateQueries({
          queryKey:
            getGetFlagsByProjectIdQueryKey(projectId),
        }),
      ]);

      toast.success(
        `${flag.name ?? 'Feature flag'} scheduled to ${
          action === 'enable' ? 'enable' : 'disable'
        }`
      );

      setOpen(false);
      resetForm();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to schedule the feature flag.'
        )
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && isPending) return;

        if (nextOpen) {
          resetForm();
        }

        setOpen(nextOpen);
      }}
    >
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:bg-primary-subtle hover:text-primary"
            disabled={!flag.id}
            title="Schedule a flag change"
          />
        }
      >
        <CalendarClock className="size-4" />
        <span className="sr-only">
          Schedule flag change
        </span>
      </DialogTrigger>

      <DialogContent className="border border-border bg-popover text-foreground ring-0 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Schedule {flag.name ?? 'feature flag'}
          </DialogTitle>

          <DialogDescription className="text-muted-foreground">
            Select the state and local time when this flag
            should change. A new schedule replaces an existing
            schedule for this flag.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-3">
          <div className="space-y-2">
            <Label>Action</Label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                className={
                  action === 'enable'
                    ? 'flex items-center gap-3 rounded-xl border border-success/30 bg-success-subtle p-4 text-left'
                    : 'flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left hover:bg-surface-elevated'
                }
                onClick={() => setAction('enable')}
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-success-subtle">
                  <Power className="size-4 text-success" />
                </div>

                <div>
                  <p className="text-sm text-foreground">
                    Enable
                  </p>

                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Turn feature on
                  </p>
                </div>
              </button>

              <button
                type="button"
                className={
                  action === 'disable'
                    ? 'flex items-center gap-3 rounded-xl border border-warning/30 bg-warning-subtle p-4 text-left'
                    : 'flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left hover:bg-surface-elevated'
                }
                onClick={() => setAction('disable')}
              >
                <div className="flex size-9 items-center justify-center rounded-lg bg-warning-subtle">
                  <PowerOff className="size-4 text-warning" />
                </div>

                <div>
                  <p className="text-sm text-foreground">
                    Disable
                  </p>

                  <p className="mt-1 text-[10px] text-muted-foreground">
                    Turn feature off
                  </p>
                </div>
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={`schedule-${flag.id}`}>
              Date and time
            </Label>

            <Input
              id={`schedule-${flag.id}`}
              type="datetime-local"
              min={getMinimumScheduleTime()}
              value={scheduledAt}
              className="border-border bg-card [color-scheme:dark]"
              onChange={(event) =>
                setScheduledAt(event.target.value)
              }
            />

            <p className="text-xs text-muted-foreground">
              Your timezone:{' '}
              {Intl.DateTimeFormat().resolvedOptions()
                .timeZone || 'Local time'}
            </p>
          </div>

          <div className="rounded-xl border border-primary/30 bg-primary-subtle p-4">
            <p className="text-xs leading-5 text-primary">
              The backend stores this time in UTC. ToggleFlow
              will display it using each viewer&apos;s local
              timezone.
            </p>
          </div>
        </div>

        <DialogFooter className="border-border bg-card">
          <Button
            type="button"
            variant="outline"
            className="border-border bg-transparent"
            disabled={isPending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>

          <Button
            type="button"
            className="bg-primary text-primary-foreground hover:bg-primary-hover"
            disabled={isPending || !scheduledAt}
            onClick={scheduleChange}
          >
            {isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <CalendarClock className="size-4" />
            )}
            Schedule change
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function getDefaultScheduleTime(): string {
  const date = new Date(Date.now() + 60 * 60 * 1000);

  // Round down seconds because datetime-local normally works
  // at minute precision.
  date.setSeconds(0, 0);

  return toLocalDateTimeValue(date);
}

function getMinimumScheduleTime(): string {
  const date = new Date(Date.now() + 60 * 1000);
  date.setSeconds(0, 0);

  return toLocalDateTimeValue(date);
}

function toLocalDateTimeValue(date: Date): string {
  const offset = date.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(date.getTime() - offset);

  return localDate.toISOString().slice(0, 16);
}