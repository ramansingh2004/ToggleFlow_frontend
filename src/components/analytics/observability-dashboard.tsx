'use client';

import {
  useMemo,
  useState,
  type ComponentType,
} from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  FlaskConical,
  Gauge,
  RefreshCw,
  Server,
  TriangleAlert,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useGetProjectObservability } from '@/api/generated/analytics/analytics';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ObservabilityAlertingPanel } from '@/components/analytics/observability-alerting-panel';

const periodOptions = [6, 24, 72, 168] as const;

export function ObservabilityDashboard({
  projectId,
}: {
  projectId: string;
}) {
  const [hours, setHours] = useState<number>(24);

  const observabilityQuery =
    useGetProjectObservability(
      projectId,
      { hours },
      {
        query: {
          enabled: Boolean(projectId),
          staleTime: 30 * 1000,
          refetchInterval: 60 * 1000,
        },
      }
    );

  const observability =
    observabilityQuery.data?.data;

  const trafficData = useMemo(
    () =>
      (observability?.sdk.hourlyTrend ?? []).map(
        (item) => ({
          hour: formatHour(item.hour),
          requests: item.requests,
          errors: item.errors,
        })
      ),
    [observability?.sdk.hourlyTrend]
  );

  if (observabilityQuery.isPending) {
    return <ObservabilitySkeleton />;
  }

  if (observabilityQuery.isError) {
    return (
      <section className="mt-8 rounded-2xl border border-destructive/40 bg-destructive/10 p-6">
        <div className="flex items-start gap-3">
          <TriangleAlert className="mt-0.5 size-5 shrink-0 text-destructive" />

          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-medium text-foreground">
              Observability is unavailable
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              The operational metrics could not be loaded. The
              existing project and flag analytics remain available.
            </p>
          </div>

          <button
            type="button"
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-secondary px-3 text-xs font-medium text-secondary-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onClick={() => observabilityQuery.refetch()}
          >
            <RefreshCw className="size-3.5" />
            Retry
          </button>
        </div>
      </section>
    );
  }

  const sdk = observability?.sdk;
  const experiments = observability?.experiments;
  const warnings = observability?.warnings ?? [];
  const hasTraffic = (sdk?.totalRequests ?? 0) > 0;

  return (
    <section className="mt-8 space-y-5">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2">
            <Server className="size-4 text-primary" />
            <h2 className="text-base font-semibold text-foreground">
              Production observability
            </h2>
          </div>

          <p className="mt-2 text-sm text-muted-foreground">
            SDK reliability, request latency, endpoint health,
            and experiment activity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={String(hours)}
            onValueChange={(value) => {
              const nextHours = Number(value);

              if (
                periodOptions.includes(
                  nextHours as (typeof periodOptions)[number]
                )
              ) {
                setHours(nextHours);
              }
            }}
          >
            <SelectTrigger
              className="h-9 w-36 bg-card"
              aria-label="Observability period"
            >
              <SelectValue />
            </SelectTrigger>

            <SelectContent>
              {periodOptions.map((option) => (
                <SelectItem
                  key={option}
                  value={String(option)}
                >
                  Last {formatPeriod(option)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            type="button"
            aria-label="Refresh observability metrics"
            title="Refresh metrics"
            className="inline-flex size-9 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            disabled={observabilityQuery.isFetching}
            onClick={() => observabilityQuery.refetch()}
          >
            <RefreshCw
              className={
                observabilityQuery.isFetching
                  ? 'size-4 animate-spin'
                  : 'size-4'
              }
            />
          </button>
        </div>
      </div>

      {warnings.length > 0 && (
        <div
          className="grid gap-3"
          aria-live="polite"
        >
          {warnings.map((warning) => (
            <OperationalNotice
              key={`${warning.code}-${warning.message}`}
              level={warning.level}
              message={warning.message}
            />
          ))}
        </div>
      )}

      <ObservabilityAlertingPanel projectId={projectId} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OperationalMetric
          label="SDK requests"
          value={formatNumber(sdk?.totalRequests)}
          detail={`${formatNumber(
            sdk?.successfulRequests
          )} successful`}
          icon={Activity}
          tone="primary"
        />

        <OperationalMetric
          label="Error rate"
          value={formatPercent(sdk?.errorRate)}
          detail={`${formatNumber(
            sdk?.failedRequests
          )} failed requests`}
          icon={AlertTriangle}
          tone={(sdk?.errorRate ?? 0) > 5 ? 'danger' : 'success'}
        />

        <OperationalMetric
          label="Average latency"
          value={formatMilliseconds(
            sdk?.averageResponseTime
          )}
          detail={`${formatNumber(
            sdk?.slowRequests
          )} slow requests`}
          icon={Clock3}
          tone="neutral"
        />

        <OperationalMetric
          label="P95 latency"
          value={formatMilliseconds(
            sdk?.p95ResponseTime
          )}
          detail={
            sdk?.lastRequestAt
              ? `Last request ${formatRelativeDate(
                  sdk.lastRequestAt
                )}`
              : 'No request recorded'
          }
          icon={Gauge}
          tone={(sdk?.p95ResponseTime ?? 0) >= 500 ? 'danger' : 'success'}
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-medium text-foreground">
              SDK traffic
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Requests and failures by hour
            </p>
          </div>

          {!hasTraffic || trafficData.length === 0 ? (
            <ObservabilityEmptyState
              icon={Server}
              title="No SDK traffic yet"
              description="Make an authenticated SDK request after deploying the observability backend. New traffic will appear here automatically."
            />
          ) : (
            <div
              className="h-80 p-4 sm:p-5"
              role="img"
              aria-label={`${sdk?.totalRequests ?? 0} SDK requests with ${sdk?.failedRequests ?? 0} failures during the selected period`}
            >
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart data={trafficData}>
                  <defs>
                    <linearGradient
                      id="requestTrafficGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--chart-1)"
                        stopOpacity={0.35}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--chart-1)"
                        stopOpacity={0}
                      />
                    </linearGradient>

                    <linearGradient
                      id="requestErrorGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="var(--destructive)"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--destructive)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <CartesianGrid
                    vertical={false}
                    stroke="var(--border)"
                    strokeOpacity={0.7}
                  />
                  <XAxis
                    dataKey="hour"
                    axisLine={false}
                    tickLine={false}
                    minTickGap={28}
                    tick={{
                      fill: 'var(--muted-foreground)',
                      fontSize: 11,
                    }}
                  />
                  <YAxis
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    width={32}
                    tick={{
                      fill: 'var(--muted-foreground)',
                      fontSize: 11,
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--popover)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      color: 'var(--popover-foreground)',
                      fontSize: 12,
                    }}
                    labelStyle={{
                      color: 'var(--popover-foreground)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    name="Requests"
                    stroke="var(--chart-1)"
                    strokeWidth={2}
                    fill="url(#requestTrafficGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="errors"
                    name="Errors"
                    stroke="var(--destructive)"
                    strokeWidth={2}
                    fill="url(#requestErrorGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h3 className="text-sm font-medium text-foreground">
              Experiment activity
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Assignments and conversions in this period
            </p>
          </div>

          <div className="grid grid-cols-2 gap-px bg-border">
            <ExperimentMetric
              label="Running"
              value={formatNumber(experiments?.running)}
            />
            <ExperimentMetric
              label="Assignments"
              value={formatNumber(
                experiments?.assignments
              )}
            />
            <ExperimentMetric
              label="Conversions"
              value={formatNumber(
                experiments?.conversions
              )}
            />
            <ExperimentMetric
              label="Conversion rate"
              value={formatPercent(
                experiments?.conversionRate
              )}
            />
          </div>

          {(experiments?.items.length ?? 0) === 0 ? (
            <ObservabilityEmptyState
              icon={FlaskConical}
              title="No experiment activity"
              description="Running experiments and their recent assignments will appear here."
              compact
            />
          ) : (
            <div className="divide-y divide-border">
              {experiments?.items.slice(0, 5).map(
                (experiment) => (
                  <div
                    key={experiment.id}
                    className="px-5 py-3.5"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="truncate text-sm font-medium text-foreground">
                        {experiment.name}
                      </p>
                      <span className="shrink-0 rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] capitalize text-muted-foreground">
                        {experiment.status}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {formatNumber(
                        experiment.assignments
                      )}{' '}
                      assignments ·{' '}
                      {formatPercent(
                        experiment.conversionRate
                      )}{' '}
                      converted
                    </p>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h3 className="text-sm font-medium text-foreground">
            Endpoint health
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Normalized SDK routes ranked by request volume
          </p>
        </div>

        {(sdk?.endpoints.length ?? 0) === 0 ? (
          <ObservabilityEmptyState
            icon={Activity}
            title="No endpoint metrics"
            description="Endpoint health becomes available after the first authenticated SDK request."
            compact
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead className="border-b border-border bg-muted/60 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 font-medium">
                    Endpoint
                  </th>
                  <th className="px-4 py-3 font-medium">
                    Requests
                  </th>
                  <th className="px-4 py-3 font-medium">
                    Errors
                  </th>
                  <th className="px-4 py-3 font-medium">
                    Error rate
                  </th>
                  <th className="px-5 py-3 text-right font-medium">
                    Avg. latency
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sdk?.endpoints.map((endpoint) => (
                  <tr
                    key={`${endpoint.method}-${endpoint.endpoint}`}
                    className="transition-colors hover:bg-muted/45"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="w-12 shrink-0 rounded-md border border-border bg-secondary px-1.5 py-1 text-center font-mono text-[10px] font-semibold text-secondary-foreground">
                          {endpoint.method}
                        </span>
                        <code className="text-xs text-foreground">
                          {endpoint.endpoint}
                        </code>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-foreground">
                      {formatNumber(endpoint.requests)}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-muted-foreground">
                      {formatNumber(endpoint.errors)}
                    </td>
                    <td className="px-4 py-3.5">
                      <HealthValue
                        value={formatPercent(
                          endpoint.errorRate
                        )}
                        healthy={endpoint.errorRate <= 5}
                      />
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono text-xs text-muted-foreground">
                      {formatMilliseconds(
                        endpoint.averageResponseTime
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}

function OperationalMetric({
  label,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  icon: ComponentType<{ className?: string }>;
  tone: 'primary' | 'success' | 'danger' | 'neutral';
}) {
  const toneClass = {
    primary: 'border-primary/35 bg-primary/10 text-primary',
    success:
      'border-emerald-400/35 bg-emerald-400/10 text-emerald-300',
    danger:
      'border-destructive/45 bg-destructive/10 text-red-200',
    neutral: 'border-border bg-muted text-muted-foreground',
  }[tone];

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div
        className={`flex size-9 items-center justify-center rounded-xl border ${toneClass}`}
      >
        <Icon className="size-4" />
      </div>
      <p className="mt-5 text-2xl font-semibold tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-1 text-xs font-medium text-foreground">
        {label}
      </p>
      <p className="mt-2 truncate text-[11px] text-muted-foreground">
        {detail}
      </p>
    </div>
  );
}

function OperationalNotice({
  level,
  message,
}: {
  level: 'info' | 'warning';
  message: string;
}) {
  const warning = level === 'warning';
  const Icon = warning ? TriangleAlert : CheckCircle2;

  return (
    <div
      className={
        warning
          ? 'flex items-start gap-3 rounded-xl border border-amber-300/35 bg-amber-300/10 px-4 py-3 text-amber-100'
          : 'flex items-start gap-3 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-foreground'
      }
    >
      <Icon
        className={
          warning
            ? 'mt-0.5 size-4 shrink-0 text-amber-200'
            : 'mt-0.5 size-4 shrink-0 text-primary'
        }
      />
      <p className="text-xs leading-5">{message}</p>
    </div>
  );
}

function ExperimentMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="bg-card px-4 py-4">
      <p className="text-lg font-semibold text-foreground">
        {value}
      </p>
      <p className="mt-1 text-[11px] text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function HealthValue({
  value,
  healthy,
}: {
  value: string;
  healthy: boolean;
}) {
  return (
    <span
      className={
        healthy
          ? 'inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 text-[11px] text-emerald-200'
          : 'inline-flex rounded-full border border-destructive/40 bg-destructive/10 px-2 py-1 text-[11px] text-red-200'
      }
    >
      {value}
    </span>
  );
}

function ObservabilityEmptyState({
  icon: Icon,
  title,
  description,
  compact = false,
}: {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? 'flex flex-col items-center justify-center px-6 py-10 text-center'
          : 'flex h-80 flex-col items-center justify-center px-6 text-center'
      }
    >
      <div className="flex size-10 items-center justify-center rounded-xl border border-border bg-muted">
        <Icon className="size-4 text-muted-foreground" />
      </div>
      <p className="mt-4 text-sm font-medium text-foreground">
        {title}
      </p>
      <p className="mt-2 max-w-sm text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function ObservabilitySkeleton() {
  return (
    <section className="mt-8 space-y-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-12 w-72 bg-muted" />
        <Skeleton className="h-9 w-44 bg-muted" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-40 rounded-2xl bg-muted"
          />
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <Skeleton className="h-96 rounded-2xl bg-muted" />
        <Skeleton className="h-96 rounded-2xl bg-muted" />
      </div>
      <Skeleton className="h-72 rounded-2xl bg-muted" />
    </section>
  );
}

function formatPeriod(hours: number) {
  if (hours < 24) return `${hours} hours`;
  if (hours === 24) return '24 hours';
  return `${hours / 24} days`;
}

function formatNumber(value?: number) {
  return new Intl.NumberFormat('en').format(value ?? 0);
}

function formatPercent(value?: number) {
  return `${(value ?? 0).toFixed(1)}%`;
}

function formatMilliseconds(value?: number) {
  const milliseconds = value ?? 0;

  if (milliseconds >= 1000) {
    return `${(milliseconds / 1000).toFixed(2)}s`;
  }

  return `${Math.round(milliseconds)}ms`;
}

function formatHour(value: string) {
  const normalized =
    value.length === 13 ? `${value}:00:00.000Z` : value;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
  }).format(date);
}

function formatRelativeDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'recently';

  const difference = Date.now() - date.getTime();
  const minutes = Math.max(0, Math.floor(difference / 60_000));

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return `${Math.floor(hours / 24)}d ago`;
}
