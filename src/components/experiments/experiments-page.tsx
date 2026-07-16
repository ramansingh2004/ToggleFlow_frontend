'use client';

import { useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Beaker,
  FolderKanban,
  LoaderCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  getGetProjectExperimentsQueryKey,
  useCreateExperiment,
  useGetProjectExperiments,
} from '@/api/generated/experiments/experiments';
import { useGetFlagsByProjectId } from '@/api/generated/feature-flags/feature-flags';
import type { Experiment } from '@/api/generated/models';
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
import {
  createExperimentSchema,
  type CreateExperimentFormValues,
} from '@/schemas/experiment.schema';
import { useUiStore } from '@/store/ui-store';
import { getApiErrorMessage } from '@/utils/get-api-error-message';

export function ExperimentsPage() {
  const selectedProjectId = useUiStore(
    (state) => state.selectedProjectId
  );

  const [createOpen, setCreateOpen] = useState(false);

  const experimentsQuery = useGetProjectExperiments(
    selectedProjectId ?? '',
    {
      query: {
        enabled: Boolean(selectedProjectId),
        staleTime: 30 * 1000,
      },
    }
  );

  const experiments = experimentsQuery.data?.data ?? [];

  if (!selectedProjectId) {
    return <NoProjectSelected />;
  }

  return (
    <main className="p-5 sm:p-7 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-indigo-300">
              Experimentation
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">
              Experiments
            </h1>

            <p className="mt-3 text-sm text-zinc-500">
              Test flag variants and measure conversion
              performance.
            </p>
          </div>

          <CreateExperimentDialog
            projectId={selectedProjectId}
            open={createOpen}
            onOpenChange={setCreateOpen}
          />
        </div>

        <ExperimentWorkflow />

        <div className="mt-8">
          {experimentsQuery.isPending && (
            <ExperimentsSkeleton />
          )}

          {experimentsQuery.isError && (
            <div className="rounded-2xl border border-red-400/10 bg-red-500/[0.03] py-16 text-center text-sm text-zinc-500">
              Unable to load experiments.
            </div>
          )}

          {experimentsQuery.isSuccess &&
            experiments.length === 0 && (
              <EmptyExperiments
                onCreate={() => setCreateOpen(true)}
              />
            )}

          {experiments.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-2">
              {experiments.map((experiment, index) => (
                <ExperimentCard
                  key={experiment.id ?? index}
                  experiment={experiment}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function ExperimentCard({
  experiment,
}: {
  experiment: Experiment;
}) {
  const variants =
    experiment.variantCount ?? experiment.variants.length;

  return (
    <article className="group rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition-colors hover:border-indigo-400/20">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-fuchsia-400/15 bg-fuchsia-500/10">
            <Beaker className="size-4 text-fuchsia-300" />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-sm font-medium text-zinc-200">
              {experiment.name}
            </h2>

            <p className="mt-1 font-mono text-xs text-zinc-600">
              {experiment.conversionMetric}
            </p>
          </div>
        </div>

        <StatusBadge status={experiment.status} />
      </div>

      <p className="mt-5 line-clamp-2 min-h-10 text-sm leading-5 text-zinc-600">
        {experiment.description ||
          'No experiment description provided.'}
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-700">
            Variants
          </p>

          <p className="mt-1 text-xs text-zinc-400">
            {variants}
          </p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-700">
            Created
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            {formatDate(experiment.createdAt)}
          </p>
        </div>
      </div>

      <Link
        href={`/experiments/${experiment.id}`}
        className="mt-5 flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 text-xs text-zinc-500 transition-colors hover:bg-white/[0.05] hover:text-indigo-300"
      >
        View experiment
        <ArrowRight className="size-3.5" />
      </Link>
    </article>
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

interface CreateExperimentDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateExperimentDialog({
  projectId,
  open,
  onOpenChange,
}: CreateExperimentDialogProps) {
  const queryClient = useQueryClient();
  const createMutation = useCreateExperiment();

  const flagsQuery = useGetFlagsByProjectId(projectId, {
    query: {
      enabled: open,
      staleTime: 30 * 1000,
    },
  });

  const flags = flagsQuery.data?.data ?? [];

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateExperimentFormValues>({
    resolver: zodResolver(createExperimentSchema),
    defaultValues: {
      name: '',
      description: '',
      flagId: '',
      conversionMetric: '',
      variants: [
        {
          name: 'Control',
          weight: 50,
        },
        {
          name: 'Variant A',
          weight: 50,
        },
      ],
    },
  });

  const {
    fields,
    append,
    remove,
  } = useFieldArray({
    control,
    name: 'variants',
  });

  const variants = watch('variants');
  const selectedFlagId = watch('flagId');
  const selectedFlag = flags.find(
    (flag) => flag.id === selectedFlagId
  );

  const totalWeight = variants.reduce(
    (total, variant) =>
      total + (Number(variant.weight) || 0),
    0
  );

  const closeDialog = () => {
    reset();
    onOpenChange(false);
  };

  const onSubmit = async (
    values: CreateExperimentFormValues
  ) => {
    try {
      await createMutation.mutateAsync({
        projectId,
        data: {
          name: values.name.trim(),
          description:
            values.description?.trim() || null,
          flagId: values.flagId,
          conversionMetric:
            values.conversionMetric.trim(),
          variants: values.variants.map((variant) => ({
            name: variant.name.trim(),
            weight: variant.weight,
          })),
        },
      });

      await queryClient.invalidateQueries({
        queryKey:
          getGetProjectExperimentsQueryKey(projectId),
      });

      toast.success('Experiment created');
      closeDialog();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to create the experiment.'
        )
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && createMutation.isPending) return;

        if (nextOpen) {
          onOpenChange(true);
        } else {
          closeDialog();
        }
      }}
    >
      <DialogTrigger
        render={
          <Button className="h-9 bg-indigo-500 px-4 text-white hover:bg-indigo-400" />
        }
      >
        <Plus className="size-4" />
        New experiment
      </DialogTrigger>

      <DialogContent className="max-h-[88vh] overflow-y-auto border border-white/[0.09] bg-[#0d111a] text-white ring-0 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create experiment</DialogTitle>

          <DialogDescription className="text-zinc-500">
            Configure a weighted feature-flag experiment.
            Experiments are created as drafts.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-5 py-3">
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                label="Name"
                error={errors.name?.message}
              >
                <Input
                  placeholder="Homepage CTA test"
                  className="border-white/10 bg-white/[0.035]"
                  {...register('name')}
                />
              </FormField>

              <FormField
                label="Conversion metric"
                error={errors.conversionMetric?.message}
              >
                <Input
                  placeholder="signup"
                  className="border-white/10 bg-white/[0.035] font-mono"
                  {...register('conversionMetric')}
                />
              </FormField>
            </div>

            <FormField
              label="Feature flag"
              error={errors.flagId?.message}
            >
              <select
                className="flex h-9 w-full rounded-md border border-white/10 bg-white/[0.035] px-3 text-sm text-zinc-300 outline-none focus:border-indigo-400/40"
                {...register('flagId')}
              >
                <option value="" className="bg-[#0d111a]">
                  Select a feature flag
                </option>

                {flags.map((flag) =>
                  flag.id ? (
                    <option
                      key={flag.id}
                      value={flag.id}
                      className="bg-[#0d111a]"
                    >
                      {flag.name ?? flag.key ?? flag.id}
                      {flag.enabled ? '' : ' — disabled'}
                    </option>
                  ) : null
                )}
              </select>

              {flagsQuery.isSuccess &&
                flags.length === 0 && (
                  <p className="text-xs text-amber-400">
                    Create a feature flag before creating an
                    experiment.
                  </p>
                )}

              {selectedFlag && !selectedFlag.enabled && (
                <p className="text-xs leading-5 text-amber-400/80">
                  You can create this experiment as a draft,
                  but its flag must be enabled before users can
                  receive variant assignments.
                </p>
              )}
            </FormField>

            <FormField
              label="Description"
              error={errors.description?.message}
            >
              <textarea
                rows={3}
                placeholder="What hypothesis are you testing?"
                className="w-full resize-none rounded-md border border-white/10 bg-white/[0.035] px-3 py-2 text-sm text-zinc-300 outline-none placeholder:text-zinc-700 focus:border-indigo-400/40"
                {...register('description')}
              />
            </FormField>

            <div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label>Variants</Label>

                  <p className="mt-1 text-xs text-zinc-600">
                    Weights must total exactly 100%.
                  </p>
                </div>

                <span
                  className={
                    totalWeight === 100
                      ? 'rounded-full border border-emerald-400/15 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300'
                      : 'rounded-full border border-red-400/15 bg-red-500/10 px-2.5 py-1 text-xs text-red-300'
                  }
                >
                  {totalWeight}%
                </span>
              </div>

              <div className="mt-3 space-y-3">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="grid gap-3 rounded-xl border border-white/[0.07] bg-white/[0.02] p-3 sm:grid-cols-[1fr_110px_36px] sm:items-start"
                  >
                    <div>
                      <Input
                        aria-label={`Variant ${index + 1} name`}
                        placeholder={`Variant ${index + 1}`}
                        className="border-white/10 bg-black/20"
                        {...register(
                          `variants.${index}.name`
                        )}
                      />

                      {errors.variants?.[index]?.name && (
                        <p className="mt-1 text-xs text-red-400">
                          {
                            errors.variants[index]?.name
                              ?.message
                          }
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="relative">
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          aria-label={`Variant ${index + 1} weight`}
                          className="border-white/10 bg-black/20 pr-7"
                          {...register(
                            `variants.${index}.weight`,
                            {
                              valueAsNumber: true,
                            }
                          )}
                        />

                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-600">
                          %
                        </span>
                      </div>

                      {errors.variants?.[index]?.weight && (
                        <p className="mt-1 text-xs text-red-400">
                          {
                            errors.variants[index]?.weight
                              ?.message
                          }
                        </p>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-zinc-600 hover:text-red-400"
                      disabled={fields.length <= 2}
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="size-4" />
                      <span className="sr-only">
                        Remove variant
                      </span>
                    </Button>
                  </div>
                ))}
              </div>

              {errors.variants?.root?.message && (
                <p className="mt-2 text-xs text-red-400">
                  {errors.variants.root.message}
                </p>
              )}

              {typeof errors.variants?.message ===
                'string' && (
                <p className="mt-2 text-xs text-red-400">
                  {errors.variants.message}
                </p>
              )}

              <Button
                type="button"
                variant="outline"
                className="mt-3 border-white/10 bg-transparent text-zinc-400"
                onClick={() =>
                  append({
                    name: `Variant ${String.fromCharCode(
                      64 + fields.length
                    )}`,
                    weight: 1,
                  })
                }
              >
                <Plus className="size-4" />
                Add variant
              </Button>
            </div>
          </div>

          <DialogFooter className="border-white/[0.07] bg-white/[0.02]">
            <Button
              type="button"
              variant="outline"
              className="border-white/10 bg-transparent"
              disabled={createMutation.isPending}
              onClick={closeDialog}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="bg-indigo-500 text-white hover:bg-indigo-400"
              disabled={
                createMutation.isPending ||
                flags.length === 0 ||
                totalWeight !== 100
              }
            >
              {createMutation.isPending && (
                <LoaderCircle className="size-4 animate-spin" />
              )}
              Create experiment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
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

        <p className="mt-2 text-sm text-zinc-600">
          Choose a project before managing experiments.
        </p>

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

function EmptyExperiments({
  onCreate,
}: {
  onCreate: () => void;
}) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.015] px-6 text-center">
      <Beaker className="size-8 text-fuchsia-300" />

      <h2 className="mt-5 text-base font-medium text-white">
        Create your first experiment
      </h2>

      <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-600">
        Compare flag variants and learn which experience
        produces the best conversion rate.
      </p>

      <Button
        className="mt-6 bg-indigo-500 text-white hover:bg-indigo-400"
        onClick={onCreate}
      >
        <Plus className="size-4" />
        New experiment
      </Button>
    </div>
  );
}

function ExperimentsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-64 rounded-2xl bg-white/[0.04]"
        />
      ))}
    </div>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function ExperimentWorkflow() {
  const steps = [
    {
      number: '01',
      title: 'Create draft',
      description: 'Choose a flag, metric, and weighted variants.',
    },
    {
      number: '02',
      title: 'Start',
      description: 'Enable the flag and begin accepting assignments.',
    },
    {
      number: '03',
      title: 'Measure',
      description: 'Assign users and track the configured conversion.',
    },
    {
      number: '04',
      title: 'Conclude',
      description: 'Review significance, end the test, and record findings.',
    },
  ];

  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
      <div className="grid gap-px bg-white/[0.06] sm:grid-cols-2 xl:grid-cols-4">
        {steps.map((step) => (
          <div
            key={step.number}
            className="bg-[#090c13] p-4"
          >
            <div className="flex items-center gap-3">
              <span className="font-mono text-[10px] text-indigo-400">
                {step.number}
              </span>

              <p className="text-xs font-medium text-zinc-300">
                {step.title}
              </p>
            </div>

            <p className="mt-2 text-xs leading-5 text-zinc-600">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}