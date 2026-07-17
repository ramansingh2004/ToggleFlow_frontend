'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Award,
  Beaker,
  Check,
  CheckCircle2,
  Code2,
  Copy,
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
        refetchInterval: 15 * 1000,
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
          <Beaker className="mx-auto size-8 text-destructive" />

          <h1 className="mt-5 text-lg font-medium text-foreground">
            Experiment unavailable
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            It may have been removed or you may not have
            permission to access it.
          </p>

          <Link
            href="/experiments"
            className="mt-6 inline-flex text-sm text-primary hover:text-primary"
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
          className="inline-flex items-center gap-2 text-xs text-muted-foreground transition-colors hover:text-foreground-secondary"
        >
          <ArrowLeft className="size-3.5" />
          Experiments
        </Link>

        <div className="mt-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-[-0.03em] text-foreground">
                {experiment.name}
              </h1>

              <StatusBadge status={experiment.status} />
            </div>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
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

        <IntegrationGuide experiment={experiment} />
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
        className="bg-success text-success-foreground hover:bg-success/90"
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
          className="border-destructive/30 bg-destructive-subtle text-destructive hover:bg-destructive-subtle"
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
          <DialogContent className="border border-border bg-popover text-foreground ring-0 sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>End experiment?</DialogTitle>

              <DialogDescription className="text-muted-foreground">
                The experiment will be marked as completed and
                cannot be restarted.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-2 py-3">
              <label
                htmlFor="experiment-conclusion"
                className="text-sm text-foreground-secondary"
              >
                Conclusion
                <span className="ml-1 text-muted-foreground">
                  (optional)
                </span>
              </label>

              <textarea
                id="experiment-conclusion"
                rows={5}
                maxLength={1000}
                value={conclusion}
                placeholder="Summarize what you learned from this experiment..."
                className="w-full resize-none rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground-secondary outline-none placeholder:text-muted-foreground focus:border-primary/30"
                onChange={(event) =>
                  setConclusion(event.target.value)
                }
              />

              <p className="text-right text-[10px] text-muted-foreground">
                {conclusion.length}/1000
              </p>
            </div>

            <DialogFooter className="border-border bg-card">
              <Button
                type="button"
                variant="outline"
                className="border-border bg-transparent"
                disabled={endMutation.isPending}
                onClick={() => setEndOpen(false)}
              >
                Cancel
              </Button>

              <Button
                type="button"
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
    <div className="inline-flex items-center gap-2 rounded-xl border border-primary/30 bg-primary-subtle px-4 py-2 text-xs text-primary">
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
      confidenceIntervalLow:
        result?.confidenceIntervalLow ?? 0,
      confidenceIntervalHigh:
        result?.confidenceIntervalHigh ?? 0,
    };
  });

  return (
    <section className="rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-medium text-foreground">
          Variant performance
        </h2>

        <p className="mt-1 text-xs text-muted-foreground">
          Results collected for each weighted variant.
        </p>
      </div>

      <div className="divide-y divide-border">
        {variants.map((variant) => (
          <div
            key={variant.id}
            className="px-5 py-5"
          >
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <FlaskConical className="size-4 text-foreground-secondary" />

                  <p className="text-sm font-medium text-foreground">
                    {variant.name}
                  </p>
                </div>

                <p className="mt-1 text-xs text-muted-foreground">
                  Traffic allocation: {variant.weight}%
                </p>
              </div>

              <p className="text-2xl font-semibold tracking-tight text-foreground">
                {formatPercent(variant.conversionRate)}
              </p>
            </div>

            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-elevated">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${Math.min(
                    100,
                    variant.conversionRate
                  )}%`,
                }}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <VariantMetric
                label="Participants"
                value={formatNumber(variant.participants)}
              />

              <VariantMetric
                label="Conversions"
                value={formatNumber(variant.conversions)}
              />

              <VariantMetric
                label="95% interval"
                value={`${formatPercent(
                  variant.confidenceIntervalLow
                )}–${formatPercent(
                  variant.confidenceIntervalHigh
                )}`}
              />

              <VariantMetric
                label="Margin"
                value={`±${formatPercent(variant.confidence)}`}
              />
            </div>
          </div>
        ))}
      </div>

      {(statistics?.totalParticipants ?? 0) === 0 && (
        <div className="border-t border-warning/30 bg-warning-subtle px-5 py-4 text-xs leading-5 text-warning">
          No participants have been assigned yet. Start the
          experiment, enable its feature flag, and call
          <code className="mx-1 font-mono text-warning">
            assignExperiment()
          </code>
          from your application server.
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
  const [copied, setCopied] = useState(false);

  const copyExperimentId = async () => {
    try {
      await navigator.clipboard.writeText(experiment.id);
      setCopied(true);
      toast.success('Experiment ID copied');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Unable to copy the experiment ID.');
    }
  };

  return (
    <aside className="h-fit rounded-2xl border border-border bg-card p-5">
      <h2 className="text-sm font-medium text-foreground">
        Configuration
      </h2>

      <dl className="mt-5 space-y-5">
        <div>
          <dt className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Experiment ID
          </dt>

          <dd className="mt-2 flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate text-xs text-foreground-secondary">
              {experiment.id}
            </code>

            <button
              type="button"
              className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-primary"
              aria-label="Copy experiment ID"
              onClick={copyExperimentId}
            >
              {copied ? (
                <Check className="size-3.5 text-success" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </button>
          </dd>
        </div>

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
        <div className="mt-6 border-t border-border pt-5">
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Conclusion
          </p>

          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {experiment.conclusion}
          </p>
        </div>
      )}

      <div className="mt-6 border-t border-border pt-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Statistical significance
          </p>

          <span
            className={
              experiment.statistics?.statisticallySignificant
                ? 'text-xs text-success'
                : 'text-xs text-muted-foreground'
            }
          >
            {experiment.statistics?.statisticallySignificant
              ? 'Significant'
              : 'Not significant'}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            p-value
          </p>

          <span className="font-mono text-xs text-muted-foreground">
            {formatPValue(experiment.statistics?.pValue)}
          </span>
        </div>
      </div>
    </aside>
  );
}

function IntegrationGuide({
  experiment,
}: {
  experiment: ExperimentResultsResponseData;
}) {
  const assignmentCode = `const assignment = await toggleflow.assignExperiment(
  '${experiment.id}',
  user.id
);

if (assignment.variant.name === 'Treatment') {
  // Render the treatment experience.
}`;

  const conversionCode = `await toggleflow.trackConversion(
  '${experiment.id}',
  user.id
);`;

  return (
    <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-start gap-3 border-b border-border px-5 py-4">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary-subtle">
          <Code2 className="size-4 text-primary" />
        </div>

        <div>
          <h2 className="text-sm font-medium text-foreground">
            Application integration
          </h2>

          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Assign on the server before rendering, then record
            the conversion only when the configured event occurs.
          </p>
        </div>
      </div>

      <div className="grid gap-px bg-surface-elevated lg:grid-cols-2">
        <CodeStep
          number="01"
          title="Assign the user"
          code={assignmentCode}
        />

        <CodeStep
          number="02"
          title={`Track ${experiment.conversionMetric}`}
          code={conversionCode}
        />
      </div>

      <div className="border-t border-primary/30 bg-primary-subtle px-5 py-4 text-xs leading-5 text-primary">
        Use the same stable application user ID for both calls.
        The API key must remain server-side. This experiment is
        currently <span className="font-medium text-primary">{experiment.status}</span>.
      </div>
    </section>
  );
}

function CodeStep({
  number,
  title,
  code,
}: {
  number: string;
  title: string;
  code: string;
}) {
  const [copied, setCopied] = useState(false);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success('Code copied');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Unable to copy the code.');
    }
  };

  return (
    <div className="bg-surface p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] text-primary">
            {number}
          </span>
          <p className="text-xs font-medium text-foreground-secondary">
            {title}
          </p>
        </div>

        <button
          type="button"
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground-secondary"
          aria-label={`Copy ${title} code`}
          onClick={copyCode}
        >
          {copied ? (
            <Check className="size-3.5 text-success" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
      </div>

      <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-background p-4 text-xs leading-6 text-foreground-secondary">
        <code>{code}</code>
      </pre>
    </div>
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
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>

        <Icon className="size-4 text-primary" />
      </div>

      <p className="mt-4 truncate text-2xl font-semibold tracking-tight text-foreground">
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
      <p className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 text-xs text-foreground-secondary">
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
      <dt className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </dt>

      <dd
        className={
          mono
            ? 'mt-1 break-all font-mono text-xs text-foreground-secondary'
            : 'mt-1 text-xs text-foreground-secondary'
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
      'border-border bg-surface-elevated text-foreground-secondary',
    running:
      'border-success/30 bg-success-subtle text-success',
    completed:
      'border-primary/30 bg-primary-subtle text-primary',
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
        <Skeleton className="h-24 rounded-2xl bg-surface-elevated" />

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton
              key={index}
              className="h-28 rounded-2xl bg-surface-elevated"
            />
          ))}
        </div>

        <Skeleton className="h-96 rounded-2xl bg-surface-elevated" />
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

function formatPValue(value?: number | null): string {
  if (value == null) return 'Not available';
  if (value < 0.0001) return '< 0.0001';
  return value.toFixed(4);
}