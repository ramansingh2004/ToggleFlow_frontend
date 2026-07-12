'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  BarChart3,
  FolderKanban,
  KeyRound,
  MousePointerClick,
  ToggleLeft,
  Users,
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

import {
  useGetFlagAnalytics,
  useGetProjectAnalytics,
} from '@/api/generated/analytics/analytics';
import { useGetFlagsByProjectId } from '@/api/generated/feature-flags/feature-flags';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useUiStore } from '@/store/ui-store';

const dayOptions = [7, 30, 90] as const;

export function AnalyticsPage() {
  const selectedProjectId = useUiStore(
    (state) => state.selectedProjectId
  );

  const [selectedFlagId, setSelectedFlagId] =
    useState('');
  const [days, setDays] = useState<number>(30);

  const projectAnalyticsQuery =
    useGetProjectAnalytics(
      selectedProjectId ?? '',
      {
        query: {
          enabled: Boolean(selectedProjectId),
          staleTime: 60 * 1000,
        },
      }
    );

  const flagsQuery = useGetFlagsByProjectId(
    selectedProjectId ?? '',
    {
      query: {
        enabled: Boolean(selectedProjectId),
        staleTime: 60 * 1000,
      },
    }
  );

  const flags = flagsQuery.data?.data ?? [];

  useEffect(() => {
    if (flags.length === 0) {
      if (selectedFlagId) {
        setSelectedFlagId('');
      }
      return;
    }

    const selectionExists = flags.some(
      (flag) => flag.id === selectedFlagId
    );

    if (!selectionExists) {
      setSelectedFlagId(
        flags.find((flag) => flag.id)?.id ?? ''
      );
    }
  }, [flags, selectedFlagId]);

  const flagAnalyticsQuery = useGetFlagAnalytics(
    selectedFlagId,
    { days },
    {
      query: {
        enabled: Boolean(selectedFlagId),
        staleTime: 30 * 1000,
      },
    }
  );

  const projectAnalytics =
    projectAnalyticsQuery.data?.data;

  const flagAnalytics =
    flagAnalyticsQuery.data?.data;

  const chartData = useMemo(
    () =>
      (flagAnalytics?.dailyTrend ?? []).map(
        (item) => ({
          date: formatChartDate(item.date),
          impressions: item.count ?? 0,
          enabled: item.enabled ?? 0,
        })
      ),
    [flagAnalytics?.dailyTrend]
  );

  if (!selectedProjectId) {
    return <NoProjectSelected />;
  }

  return (
    <main className="p-5 sm:p-7 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div>
          <p className="text-sm font-medium text-indigo-300">
            Insights
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">
            Analytics
          </h1>

          <p className="mt-3 text-sm text-zinc-500">
            Understand feature usage, evaluations, and
            conversions.
          </p>
        </div>

        {projectAnalyticsQuery.isPending ? (
          <ProjectMetricsSkeleton />
        ) : projectAnalyticsQuery.isError ? (
          <div className="mt-8 rounded-2xl border border-red-400/10 bg-red-500/[0.03] py-16 text-center text-sm text-zinc-600">
            Unable to load project analytics.
          </div>
        ) : (
          <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Total flags"
              value={projectAnalytics?.flags?.total ?? 0}
              detail={`${projectAnalytics?.flags?.enabled ?? 0} enabled`}
              icon={ToggleLeft}
            />

            <MetricCard
              label="Disabled flags"
              value={
                projectAnalytics?.flags?.disabled ?? 0
              }
              detail="Current project"
              icon={Activity}
            />

            <MetricCard
              label="API keys"
              value={
                projectAnalytics?.apiKeys?.total ?? 0
              }
              detail={
                projectAnalytics?.apiKeys?.lastUsed
                  ? `Last used ${formatDate(
                      projectAnalytics.apiKeys.lastUsed
                    )}`
                  : 'Never used'
              }
              icon={KeyRound}
            />

            <MetricCard
              label="Project"
              value={
                projectAnalytics?.project?.name ??
                'Selected'
              }
              detail="Active analytics context"
              icon={FolderKanban}
            />
          </section>
        )}

        <section className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.02]">
          <div className="flex flex-col justify-between gap-4 border-b border-white/[0.07] px-5 py-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-sm font-medium text-white">
                Flag performance
              </h2>

              <p className="mt-1 text-xs text-zinc-600">
                Evaluations and enabled impressions over time
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Select
                value={selectedFlagId || null}
                onValueChange={(value) =>
                  setSelectedFlagId(value ?? '')
                }
              >
                <SelectTrigger className="h-9 w-full border-white/[0.08] bg-white/[0.025] sm:w-56">
                  <SelectValue placeholder="Select a flag" />
                </SelectTrigger>

                <SelectContent className="border border-white/[0.09] bg-[#0d111a] text-white">
                  {flags.map((flag) => {
                    if (!flag.id) return null;

                    return (
                      <SelectItem
                        key={flag.id}
                        value={flag.id}
                        className="focus:bg-white/[0.06]"
                      >
                        {flag.name ?? flag.key ?? 'Flag'}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

              <Select
                value={String(days)}
                onValueChange={(value) => {
                  const nextDays = Number(value);

                  if (
                    dayOptions.includes(
                      nextDays as (typeof dayOptions)[number]
                    )
                  ) {
                    setDays(nextDays);
                  }
                }}
              >
                <SelectTrigger className="h-9 w-full border-white/[0.08] bg-white/[0.025] sm:w-32">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent className="border border-white/[0.09] bg-[#0d111a] text-white">
                  {dayOptions.map((option) => (
                    <SelectItem
                      key={option}
                      value={String(option)}
                      className="focus:bg-white/[0.06]"
                    >
                      {option} days
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!selectedFlagId ? (
            <EmptyChart message="Create or select a feature flag to view analytics." />
          ) : flagAnalyticsQuery.isPending ? (
            <Skeleton className="m-5 h-80 bg-white/[0.04]" />
          ) : flagAnalyticsQuery.isError ? (
            <EmptyChart message="Unable to load analytics for this flag." />
          ) : (
            <>
              <div className="grid gap-3 border-b border-white/[0.07] p-5 sm:grid-cols-2 xl:grid-cols-4">
                <SmallMetric
                  label="Impressions"
                  value={
                    flagAnalytics?.metrics
                      ?.totalImpressions ?? 0
                  }
                  icon={Activity}
                />

                <SmallMetric
                  label="Estimated users"
                  value={
                    flagAnalytics?.metrics
                      ?.estimatedUsers ?? 0
                  }
                  icon={Users}
                />

                <SmallMetric
                  label="Conversions"
                  value={
                    flagAnalytics?.metrics
                      ?.conversionCount ?? 0
                  }
                  icon={MousePointerClick}
                />

                <SmallMetric
                  label="Conversion rate"
                  value={`${formatPercentage(
                    flagAnalytics?.metrics
                      ?.conversionRate
                  )}%`}
                  icon={BarChart3}
                />
              </div>

              {chartData.length === 0 ? (
                <EmptyChart message="No daily analytics have been recorded for this period." />
              ) : (
                <div className="h-96 p-5">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                  >
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient
                          id="impressionsGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#818cf8"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#818cf8"
                            stopOpacity={0}
                          />
                        </linearGradient>

                        <linearGradient
                          id="enabledGradient"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#34d399"
                            stopOpacity={0.2}
                          />
                          <stop
                            offset="95%"
                            stopColor="#34d399"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>

                      <CartesianGrid
                        vertical={false}
                        stroke="rgba(255,255,255,0.06)"
                      />

                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: '#52525b',
                          fontSize: 11,
                        }}
                      />

                      <YAxis
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: '#52525b',
                          fontSize: 11,
                        }}
                      />

                      <Tooltip
                        contentStyle={{
                          background: '#0d111a',
                          border:
                            '1px solid rgba(255,255,255,0.1)',
                          borderRadius: 12,
                          fontSize: 12,
                        }}
                        labelStyle={{
                          color: '#a1a1aa',
                        }}
                      />

                      <Area
                        type="monotone"
                        dataKey="impressions"
                        name="Impressions"
                        stroke="#818cf8"
                        strokeWidth={2}
                        fill="url(#impressionsGradient)"
                      />

                      <Area
                        type="monotone"
                        dataKey="enabled"
                        name="Enabled"
                        stroke="#34d399"
                        strokeWidth={2}
                        fill="url(#enabledGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </section>

        {(projectAnalytics?.topFlags?.length ?? 0) >
          0 && (
          <section className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.02]">
            <div className="border-b border-white/[0.07] px-5 py-4">
              <h2 className="text-sm font-medium text-white">
                Top flags
              </h2>
            </div>

            <div className="divide-y divide-white/[0.06]">
              {projectAnalytics?.topFlags?.map(
                (flag, index) => (
                  <div
                    key={flag.id ?? index}
                    className="flex items-center justify-between px-5 py-4"
                  >
                    <p className="text-sm text-zinc-300">
                      {flag.name ?? 'Unnamed flag'}
                    </p>

                    <span
                      className={
                        flag.enabled
                          ? 'text-xs text-emerald-400'
                          : 'text-xs text-zinc-600'
                      }
                    >
                      {flag.enabled
                        ? 'Enabled'
                        : 'Disabled'}
                    </span>
                  </div>
                )
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  detail: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <Icon className="size-4 text-indigo-300" />

      <p className="mt-5 truncate text-2xl font-semibold text-white">
        {value}
      </p>

      <p className="mt-1 text-xs text-zinc-400">
        {label}
      </p>

      <p className="mt-2 truncate text-[10px] text-zinc-700">
        {detail}
      </p>
    </div>
  );
}

function SmallMetric({
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
    <div className="flex items-center gap-3 rounded-xl bg-white/[0.025] p-3">
      <Icon className="size-4 text-zinc-600" />

      <div>
        <p className="text-xs text-zinc-600">{label}</p>
        <p className="mt-1 text-sm font-medium text-zinc-200">
          {value}
        </p>
      </div>
    </div>
  );
}

function EmptyChart({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex h-80 items-center justify-center px-6 text-center text-sm text-zinc-600">
      {message}
    </div>
  );
}

function NoProjectSelected() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6 text-center">
      <div>
        <FolderKanban className="mx-auto size-8 text-indigo-300" />

        <h1 className="mt-5 text-lg text-white">
          Select a project
        </h1>

        <Link
          href="/projects"
          className="mt-6 inline-flex h-9 items-center rounded-lg bg-indigo-500 px-4 text-sm text-white"
        >
          View projects
        </Link>
      </div>
    </main>
  );
}

function ProjectMetricsSkeleton() {
  return (
    <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-40 rounded-2xl bg-white/[0.04]"
        />
      ))}
    </div>
  );
}

function formatChartDate(value?: string): string {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatPercentage(value?: number): string {
  return (value ?? 0).toFixed(1);
}