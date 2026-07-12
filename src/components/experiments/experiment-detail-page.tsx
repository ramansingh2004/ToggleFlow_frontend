'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Award,
  Beaker,
  CheckCircle2,
  FlaskConical,
  LoaderCircle,
  Play,
  Square,
  Target,
  Users,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  getGetExperimentResultsQueryKey,
  getGetProjectExperimentsQueryKey,
  useEndExperiment,
  useGetExperimentResults,
  useStartExperiment,
} from '@/api/generated/experiments/experiments';
import type {
  Experiment,
  ExperimentResultsResponseData,
  ExperimentStatistics,
} from '@/api/generated/models';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { getApiErrorMessage } from '@/utils/get-api-error-message';

interface ExperimentDetailPageProps {
  experimentId: string;
}

export function ExperimentDetailPage({
  experimentId,
}: ExperimentDetailPageProps) {
  const experimentQuery = useGetExperimentResults(
    experimentId,
    {
      query: {
        staleTime: 15 * 1000,
      },
    }
  );

  if (experimentQuery.isPending) {
    return <DetailSkeleton />;
  }

  if (experimentQuery.isError || !experimentQuery.data?.data) {
    return (
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
        <div className="text-center">
          <Beaker className="mx-auto size-8 text-red-400" />

          <h1 className="mt-5 text-lg font-medium text-white">
            Experiment unavailable
          </h1>

          <p className="mt-2 text-sm text-zinc-600">
            It may have been removed or you may not have
            permission to access it.
          </p>

          <Link
            href="/experiments"
            className="mt-6 inline-flex text-sm text-indigo-300 hover:text-indigo-200"
          >
            Return to experiments
          </Link>
        </div>
      </main>
    );
  }

  const experiment = experimentQuery.data.data;

  return (
    <main className="p-5 sm:p-7 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/experiments"
          className="inline-flex items-center gap-2 text-xs text-zinc-600 transition-colors hover:text-zinc-300"
        >
          <ArrowLeft className="size-3.5" />
          Experiments
        </Link>

        <div className="mt-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-white">
                {experiment.name}
              </h1>

              <StatusBadge status={experiment.status} />
            </div>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
              {experiment.description ||
                'No experiment description provided.'}
            </p>
          </div>

          <ExperimentActions experiment={experiment} />
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            label="Participants"
            value={formatNumber(
              experiment.statistics?.totalParticipants
            )}
            icon={Users}
          />

          <MetricCard
            label="Conversions"
            value={formatNumber(
              experiment.statistics?.totalConversions
            )}
            icon={Target}
          />

          <MetricCard
            label="Conversion rate"
            value={formatPercent(
              experiment.statistics?.overallConversionRate
            )}
            icon={CheckCircle2}
          />

          <MetricCard
            label="Winning variant"
            value={
              experiment.statistics?.winningVariant ||
              'Not determined'
            }
            icon={Award}
          />
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.7fr]">
          <VariantResults
            statistics={experiment.statistics}
            experiment={experiment}
          />

          <ExperimentInformation experiment={experiment} />
        </div>
      </div>
    </main>
  );
}

function ExperimentActions({
  experiment,
}: {
  experiment: Experiment;
}) {
  const queryClient = useQueryClient();
  const [endOpen, setEndOpen] = useState(false);
  const [conclusion, setConclusion] = useState('');

  const startMutation = useStartExperiment();
  const endMutation = useEndExperiment();

  const refreshExperiment = async () => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey:
          getGetExperimentResultsQueryKey(experiment.id),
      }),
      queryClient.invalidateQueries({
        queryKey:
          getGetProjectExperimentsQueryKey(
            experiment.projectId
          ),
      }),
    ]);
  };

  const startExperiment = async () => {
    try {
      await startMutation.mutateAsync({
        experimentId: experiment.id,
      });

      await refreshExperiment();
      toast.success('Experiment started');
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to start the experiment.'
        )
      );
    }
  };

  const endExperiment = async () => {
    try {
      await endMutation.mutateAsync({
        experimentId: experiment.id,
        data: {
          conclusion: conclusion.trim() || null,
        },
      });

      await refreshExperiment();

      toast.success('Experiment completed');
      setEndOpen(false);
      setConclusion('');
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to end the experiment.'
        )
      );
    }
  };

  if (experiment.status === 'draft') {
    return (
      <Button
        className="bg-emerald-500 text-white hover:bg-emerald-400"
        disabled={startMutation.isPending}
        onClick={startExperiment}
      >
        {startMutation.isPending ? (
          <LoaderCircle className="size-4 animate-spin" />
        ) : (
          <Play className="size-4" />
        )}
        Start experiment
      </Button>
    );
  }

  if (experiment.status === 'running') {
    return (
      <>
        <Button
          variant="outline"
          className="border-red-400/20 bg-red-500/[0.06] text-red-300 hover:bg-red-500/10"
          onClick={() => setEndOpen(true)}
        >
          <Square className="size-4" />
          End experiment
        </Button>

        <Dialog
          open={endOpen}
          onOpenChange={(open) => {
            if (!open && endMutation.isPending) return;
            setEndOpen(open);
          }}
        >
          <DialogContent className="border border-white/[0.09] bg-[#0d111a] text-white ring-0 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>End experiment?</DialogTitle>

              <DialogDescription className="text-zinc-500">
                The experiment will be marked as completed and
                cannot be restarted.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-3">
              <label
                htmlFor="experiment-conclusion"
                className="text-sm text-zinc-300"
              >
                Conclusion
                <span className="ml-1 text-zinc-600">
                  (optional)
                </span>
              </label>

              <textarea
                id="experiment-conclusion"
                rows={5}
                maxLength={1000}
                value={conclusion}
                placeholder="Summarize what you learned from this experiment..."
                className="w-full resize-none rounded-md border border-white/10 bg-white/[0.035] px-3 py-2 text-sm text-zinc-300 outline-none placeholder:text-zinc-700 focus:border-indigo-400/40"
                onChange={(event) =>
                  setConclusion(event.target.value)
                }
              />

              <p className="text-right text-[10px] text-zinc-700">
                {conclusion.length}/1000
              </p>
            </div>

            <DialogFooter className="border-white/[0.07] bg-white/[0.02]">
              <Button
                type="button"
                variant="outline"
                className="border-white/10 bg-transparent"
                disabled={endMutation.isPending}
                onClick={() => setEndOpen(false)}
              >
                Cancel
              </Button>

              <Button
                type="button"
                className="bg-red-500 text-white hover:bg-red-400"
                disabled={endMutation.isPending}
                onClick={endExperiment}
              >
                {endMutation.isPending && (
                  <LoaderCircle className="size-4 animate-spin" />
                )}
                End experiment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-indigo-400/15 bg-indigo-500/[0.06] px-4 py-2 text-xs text-indigo-300">
      <CheckCircle2 className="size-4" />
      Experiment completed
    </div>
  );
}

function VariantResults({
  statistics,
  experiment,
}: {
  statistics?: ExperimentStatistics;
  experiment: Experiment;
}) {
  const statisticVariants = statistics?.variants ?? [];

  const variants = experiment.variants.map((variant) => {
    const result = statisticVariants.find(
      (item) => item.variantId === variant.id
    );

    return {
      ...variant,
      participants: result?.participants ?? 0,
      conversions: result?.conversions ?? 0,
      conversionRate: result?.conversionRate ?? 0,
      confidence: result?.confidence ?? 0,
    };
  });

  return (
    <section className="rounded-2xl border border-white/[0.07] bg-white/[0.02]">
      <div className="border-b border-white/[0.07] px-5 py-4">
        <h2 className="text-sm font-medium text-zinc-200">
          Variant performance
        </h2>

        <p className="mt-1 text-xs text-zinc-600">
          Results collected for each weighted variant.
        </p>
      </div>

      <div className="divide-y divide-white/[0.06]">
        {variants.map((variant) => (
          <div
            key={variant.id}
            className="px-5 py-5"
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <FlaskConical className="size-4 text-fuchsia-300" />

                  <p className="text-sm font-medium text-zinc-200">
                    {variant.name}
                  </p>
                </div>

                <p className="mt-1 text-xs text-zinc-600">
                  Traffic allocation: {variant.weight}%
                </p>
              </div>

              <p className="text-2xl font-semibold tracking-tight text-white">
                {formatPercent(variant.conversionRate)}
              </p>
            </div>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-fuchsia-400"
                style={{
                  width: `${Math.min(
                    100,
                    variant.conversionRate
                  )}%`,
                }}
              />
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <VariantMetric
                label="Participants"
                value={formatNumber(variant.participants)}
              />

              <VariantMetric
                label="Conversions"
                value={formatNumber(variant.conversions)}
              />

              <VariantMetric
                label="Confidence"
                value={formatPercent(variant.confidence)}
              />
            </div>
          </div>
        ))}
      </div>

      {(statistics?.totalParticipants ?? 0) === 0 && (
        <div className="border-t border-amber-400/10 bg-amber-500/[0.03] px-5 py-4 text-xs leading-5 text-amber-200/50">
          No results have been recorded yet. The current backend
          result endpoint only logs events, so statistics will
          remain empty until result persistence is implemented.
        </div>
      )}
    </section>
  );
}

function ExperimentInformation({
  experiment,
}: {
  experiment: ExperimentResultsResponseData;
}) {
  return (
    <aside className="h-fit rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5">
      <h2 className="text-sm font-medium text-zinc-200">
        Configuration
      </h2>

      <dl className="mt-5 space-y-5">
        <InformationRow
          label="Conversion metric"
          value={experiment.conversionMetric}
          mono
        />

        <InformationRow
          label="Feature flag ID"
          value={experiment.flagId}
          mono
        />

        <InformationRow
          label="Created"
          value={formatDateTime(experiment.createdAt)}
        />

        <InformationRow
          label="Started"
          value={formatDateTime(experiment.startedAt)}
        />

        <InformationRow
          label="Ended"
          value={formatDateTime(experiment.endedAt)}
        />
      </dl>

      {experiment.conclusion && (
        <div className="mt-6 border-t border-white/[0.06] pt-5">
          <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-700">
            Conclusion
          </p>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            {experiment.conclusion}
          </p>
        </div>
      )}

      <div className="mt-6 border-t border-white/[0.06] pt-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-zinc-600">
            Statistical significance
          </p>

          <span
            className={
              experiment.statistics?.statisticallySignificant
                ? 'text-xs text-emerald-300'
                : 'text-xs text-zinc-600'
            }
          >
            {experiment.statistics?.statisticallySignificant
              ? 'Significant'
              : 'Not significant'}
          </span>
        </div>
      </div>
    </aside>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-zinc-600">{label}</p>

        <Icon className="size-4 text-indigo-300" />
      </div>

      <p className="mt-4 truncate text-2xl font-semibold tracking-tight text-white">
        {value}
      </p>
    </div>
  );
}

function VariantMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.1em] text-zinc-700">
        {label}
      </p>

      <p className="mt-1 text-xs text-zinc-400">
        {value}
      </p>
    </div>
  );
}

function InformationRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-[0.12em] text-zinc-700">
        {label}
      </dt>

      <dd
        className={
          mono
            ? 'mt-1 break-all font-mono text-xs text-zinc-400'
            : 'mt-1 text-xs text-zinc-400'
        }
      >
        {value}
      </dd>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: Experiment['status'];
}) {
  const styles = {
    draft:
      'border-zinc-400/10 bg-zinc-500/10 text-zinc-400',
    running:
      'border-emerald-400/15 bg-emerald-500/10 text-emerald-300',
    completed:
      'border-indigo-400/15 bg-indigo-500/10 text-indigo-300',
  };

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] capitalize ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function DetailSkeleton() {
  return (
    <main className="p-5 sm:p-7 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-24 rounded-2xl bg-white/[0.04]" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-28 rounded-2xl bg-white/[0.04]"
            />
          ))}
        </div>

        <Skeleton className="h-96 rounded-2xl bg-white/[0.04]" />
      </div>
    </main>
  );
}

function formatNumber(value?: number): string {
  return new Intl.NumberFormat('en').format(value ?? 0);
}

function formatPercent(value?: number): string {
  return `${(value ?? 0).toFixed(2)}%`;
}

function formatDateTime(value?: string | null): string {
  if (!value) return 'Not yet';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}