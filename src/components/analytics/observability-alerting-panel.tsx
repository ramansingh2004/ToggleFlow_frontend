'use client';

import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  BellRing,
  CheckCircle2,
  History,
  LoaderCircle,
  Play,
  Settings2,
  TriangleAlert,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  getGetProjectAlertingQueryKey,
  getGetProjectObservabilityQueryKey,
  useEvaluateProjectAlerting,
  useGetProjectAlerting,
  useUpdateProjectAlerting,
} from '@/api/generated/analytics/analytics';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { getApiErrorMessage } from '@/utils/get-api-error-message';

interface AlertConfigDraft {
  enabled: boolean;
  windowMinutes: number;
  minimumRequests: number;
  errorRateThreshold: number;
  p95LatencyThreshold: number;
  cooldownMinutes: number;
}

interface AlertView {
  id: string;
  type: 'ERROR_RATE' | 'P95_LATENCY';
  status: 'OPEN' | 'RESOLVED';
  measuredValue: number;
  thresholdValue: number;
  requestCount: number;
  triggeredAt: string;
  resolvedAt?: string | null;
}

const defaultConfig: AlertConfigDraft = {
  enabled: false,
  windowMinutes: 15,
  minimumRequests: 20,
  errorRateThreshold: 5,
  p95LatencyThreshold: 500,
  cooldownMinutes: 60,
};

export function ObservabilityAlertingPanel({
  projectId,
}: {
  projectId: string;
}) {
  const queryClient = useQueryClient();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [draft, setDraft] =
    useState<AlertConfigDraft>(defaultConfig);

  const alertingQuery = useGetProjectAlerting(projectId, {
    query: {
      enabled: Boolean(projectId),
      staleTime: 30 * 1000,
      refetchInterval: 60 * 1000,
    },
  });
  const updateMutation = useUpdateProjectAlerting();
  const evaluateMutation = useEvaluateProjectAlerting();

  const alerting = alertingQuery.data?.data;
  const config = alerting?.config;

  useEffect(() => {
    if (!config) return;
    setDraft({
      enabled: config.enabled,
      windowMinutes: config.windowMinutes,
      minimumRequests: config.minimumRequests,
      errorRateThreshold: config.errorRateThreshold,
      p95LatencyThreshold: config.p95LatencyThreshold,
      cooldownMinutes: config.cooldownMinutes,
    });
  }, [config]);

  const refreshAlerting = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: getGetProjectAlertingQueryKey(projectId),
      }),
      queryClient.invalidateQueries({
        queryKey: getGetProjectObservabilityQueryKey(projectId),
      }),
    ]);
  };

  const beginConfigure = () => {
    if (config) {
      setDraft({
        enabled: config.enabled,
        windowMinutes: config.windowMinutes,
        minimumRequests: config.minimumRequests,
        errorRateThreshold: config.errorRateThreshold,
        p95LatencyThreshold: config.p95LatencyThreshold,
        cooldownMinutes: config.cooldownMinutes,
      });
    }
    setSettingsOpen(true);
  };

  const saveSettings = async () => {
    try {
      await updateMutation.mutateAsync({
        projectId,
        data: draft,
      });
      await refreshAlerting();
      setSettingsOpen(false);
      toast.success(
        draft.enabled
          ? 'Observability alerts enabled'
          : 'Observability alerts paused'
      );
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to update alert settings.'
        )
      );
    }
  };

  const evaluateNow = async () => {
    try {
      const response = await evaluateMutation.mutateAsync({
        projectId,
      });
      await refreshAlerting();

      if (!response.data?.evaluated) {
        const requestCount = response.data?.requestCount ?? 0;
        const minimum = response.data?.minimumRequests;
        toast.info(
          minimum
            ? `Waiting for more traffic: ${requestCount}/${minimum} requests.`
            : response.data?.reason ?? 'Alerting is disabled.'
        );
        return;
      }

      toast.success('Alert thresholds evaluated');
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Unable to evaluate alerts.')
      );
    }
  };

  if (alertingQuery.isPending) {
    return <Skeleton className="h-52 rounded-2xl bg-muted" />;
  }

  if (alertingQuery.isError) {
    return (
      <div className="rounded-2xl border border-destructive/35 bg-destructive/10 p-5">
        <p className="text-sm font-medium text-foreground">
          Alert settings could not be loaded.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-4"
          onClick={() => alertingQuery.refetch()}
        >
          Retry
        </Button>
      </div>
    );
  }

  const openAlerts = (alerting?.openAlerts ?? []) as AlertView[];
  const recentAlerts = (alerting?.recentAlerts ?? []) as AlertView[];

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex flex-col justify-between gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <div
              className={
                openAlerts.length > 0
                  ? 'flex size-9 items-center justify-center rounded-xl border border-destructive/40 bg-destructive/10 text-destructive'
                  : 'flex size-9 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary'
              }
            >
              <BellRing className="size-4" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm font-medium text-foreground">
                  Reliability alerts
                </h3>
                <span
                  className={
                    config?.enabled
                      ? 'rounded-full border border-success/30 bg-success-subtle px-2 py-0.5 text-[10px] text-success'
                      : 'rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground'
                  }
                >
                  {config?.enabled ? 'Monitoring' : 'Paused'}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {openAlerts.length > 0
                  ? `${openAlerts.length} open alert${openAlerts.length === 1 ? '' : 's'} require attention.`
                  : 'Error-rate and p95-latency thresholds are healthy.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={
                !config?.enabled || evaluateMutation.isPending
              }
              onClick={evaluateNow}
            >
              {evaluateMutation.isPending ? (
                <LoaderCircle className="size-3.5 animate-spin" />
              ) : (
                <Play className="size-3.5" />
              )}
              Evaluate now
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={beginConfigure}
            >
              <Settings2 className="size-3.5" />
              Configure
            </Button>
          </div>
        </div>

        {openAlerts.length > 0 && (
          <div className="grid gap-3 border-b border-border bg-destructive/5 p-4 md:grid-cols-2">
            {openAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
            ))}
          </div>
        )}

        <div className="px-5 py-4">
          <div className="flex items-center gap-2">
            <History className="size-3.5 text-muted-foreground" />
            <p className="text-xs font-medium text-foreground">
              Recent alert history
            </p>
          </div>

          {recentAlerts.length === 0 ? (
            <p className="mt-4 text-xs text-muted-foreground">
              No alerts have been triggered for this project.
            </p>
          ) : (
            <div className="mt-3 divide-y divide-border">
              {recentAlerts.slice(0, 8).map((alert) => (
                <AlertHistoryRow key={alert.id} alert={alert} />
              ))}
            </div>
          )}
        </div>
      </div>

      <AlertSettingsDialog
        open={settingsOpen}
        draft={draft}
        pending={updateMutation.isPending}
        onOpenChange={setSettingsOpen}
        onChange={setDraft}
        onSave={saveSettings}
      />
    </>
  );
}

function AlertSettingsDialog({
  open,
  draft,
  pending,
  onOpenChange,
  onChange,
  onSave,
}: {
  open: boolean;
  draft: AlertConfigDraft;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (draft: AlertConfigDraft) => void;
  onSave: () => void;
}) {
  const updateNumber = (
    field: Exclude<keyof AlertConfigDraft, 'enabled'>,
    value: string
  ) => {
    onChange({ ...draft, [field]: Number(value) });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && pending) return;
        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configure reliability alerts</DialogTitle>
          <DialogDescription>
            Thresholds are evaluated against authenticated SDK traffic.
            Subscribed project webhooks receive trigger and recovery events.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 p-4">
            <div>
              <p className="text-sm font-medium text-foreground">
                Enable monitoring
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Evaluate these thresholds automatically every minute.
              </p>
            </div>
            <Switch
              checked={draft.enabled}
              onCheckedChange={(enabled) =>
                onChange({ ...draft, enabled })
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              id="alert-window"
              label="Rolling window"
              suffix="minutes"
              min={5}
              max={1440}
              value={draft.windowMinutes}
              onChange={(value) =>
                updateNumber('windowMinutes', value)
              }
            />
            <NumberField
              id="alert-minimum-requests"
              label="Minimum traffic"
              suffix="requests"
              min={1}
              max={100000}
              value={draft.minimumRequests}
              onChange={(value) =>
                updateNumber('minimumRequests', value)
              }
            />
            <NumberField
              id="alert-error-rate"
              label="Error-rate threshold"
              suffix="percent"
              min={0}
              max={100}
              step="0.1"
              value={draft.errorRateThreshold}
              onChange={(value) =>
                updateNumber('errorRateThreshold', value)
              }
            />
            <NumberField
              id="alert-p95"
              label="P95 threshold"
              suffix="milliseconds"
              min={1}
              max={60000}
              value={draft.p95LatencyThreshold}
              onChange={(value) =>
                updateNumber('p95LatencyThreshold', value)
              }
            />
          </div>

          <NumberField
            id="alert-cooldown"
            label="Repeat-notification cooldown"
            suffix="minutes"
            min={5}
            max={10080}
            value={draft.cooldownMinutes}
            onChange={(value) =>
              updateNumber('cooldownMinutes', value)
            }
          />

          <div className="rounded-xl border border-primary/25 bg-primary/10 p-3 text-xs leading-5 text-muted-foreground">
            To receive notifications, create or update a project webhook
            subscribed to <code>observability.alert.triggered</code> and{' '}
            <code>observability.alert.resolved</code>.
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            disabled={pending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button disabled={pending} onClick={onSave}>
            {pending && (
              <LoaderCircle className="size-4 animate-spin" />
            )}
            Save alert settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NumberField({
  id,
  label,
  suffix,
  value,
  onChange,
  ...inputProps
}: {
  id: string;
  label: string;
  suffix: string;
  value: number;
  onChange: (value: string) => void;
  min: number;
  max: number;
  step?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        value={Number.isNaN(value) ? '' : value}
        onChange={(event) => onChange(event.target.value)}
        {...inputProps}
      />
      <p className="text-[11px] text-muted-foreground">{suffix}</p>
    </div>
  );
}

function AlertCard({ alert }: { alert: AlertView }) {
  return (
    <div className="rounded-xl border border-destructive/35 bg-card p-4">
      <div className="flex items-start gap-3">
        <TriangleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div>
          <p className="text-sm font-medium text-foreground">
            {alertLabel(alert.type)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Current {formatMetric(alert.type, alert.measuredValue)} · threshold{' '}
            {formatMetric(alert.type, alert.thresholdValue)}
          </p>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Based on {alert.requestCount} requests · opened{' '}
            {formatRelativeDate(alert.triggeredAt)}
          </p>
        </div>
      </div>
    </div>
  );
}

function AlertHistoryRow({ alert }: { alert: AlertView }) {
  const open = alert.status === 'OPEN';
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        {open ? (
          <TriangleAlert className="size-4 shrink-0 text-destructive" />
        ) : (
          <CheckCircle2 className="size-4 shrink-0 text-success" />
        )}
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-foreground">
            {alertLabel(alert.type)}
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {formatMetric(alert.type, alert.measuredValue)} from{' '}
            {alert.requestCount} requests
          </p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <span
          className={
            open
              ? 'text-[10px] font-medium text-destructive'
              : 'text-[10px] font-medium text-success'
          }
        >
          {open ? 'Open' : 'Resolved'}
        </span>
        <p className="mt-1 text-[10px] text-muted-foreground">
          {formatRelativeDate(alert.resolvedAt ?? alert.triggeredAt)}
        </p>
      </div>
    </div>
  );
}

function alertLabel(type: AlertView['type']) {
  return type === 'ERROR_RATE'
    ? 'High SDK error rate'
    : 'High SDK p95 latency';
}

function formatMetric(type: AlertView['type'], value: number) {
  return type === 'ERROR_RATE'
    ? `${value.toFixed(1)}%`
    : value >= 1000
      ? `${(value / 1000).toFixed(2)}s`
      : `${Math.round(value)}ms`;
}

function formatRelativeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'recently';

  const minutes = Math.max(
    0,
    Math.floor((Date.now() - date.getTime()) / 60_000)
  );
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
