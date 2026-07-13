'use client';

import { useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import {
  Braces,
  FolderKanban,
  ListFilter,
  LoaderCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import type {
  Segment,
  SegmentRule,
} from '@/api/generated/models';
import {
  getGetProjectSegmentsQueryKey,
  useCreateSegment,
  useGetProjectSegments,
} from '@/api/generated/segments/segments';
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
  createSegmentFormSchema,
  type SegmentFormValues,
} from '@/schemas/segment.schema';
import { useUiStore } from '@/store/ui-store';
import { getApiErrorMessage } from '@/utils/get-api-error-message';
import { SegmentActions } from '@/components/segments/segment-actions';

export function SegmentsPage() {
  const selectedProjectId = useUiStore(
    (state) => state.selectedProjectId
  );

  const [createOpen, setCreateOpen] = useState(false);

  const segmentsQuery = useGetProjectSegments(
    selectedProjectId ?? '',
    {
      query: {
        enabled: Boolean(selectedProjectId),
        staleTime: 30 * 1000,
      },
    }
  );

  const segments = segmentsQuery.data?.data ?? [];

  if (!selectedProjectId) {
    return <NoProjectSelected />;
  }

  return (
    <main className="p-5 sm:p-7 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-indigo-300">
              Audience targeting
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">
              Segments
            </h1>

            <p className="mt-3 text-sm text-zinc-500">
              Group users using reusable targeting rules.
            </p>
          </div>

          <CreateSegmentDialog
            projectId={selectedProjectId}
            open={createOpen}
            onOpenChange={setCreateOpen}
          />
        </div>

        <div className="mt-8">
          {segmentsQuery.isPending && (
            <SegmentsSkeleton />
          )}

          {segmentsQuery.isError && (
            <div className="rounded-2xl border border-red-400/10 bg-red-500/[0.03] py-16 text-center text-sm text-zinc-500">
              Unable to load segments.
            </div>
          )}

          {segmentsQuery.isSuccess &&
            segments.length === 0 && (
              <EmptySegments
                onCreate={() => setCreateOpen(true)}
              />
            )}

          {segments.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-2">
              {segments.map((segment) => (
                <SegmentCard
                  key={segment.id}
                  segment={segment}
                  projectId={selectedProjectId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function SegmentCard({
  segment,
  projectId,
}: {
  segment: Segment;
  projectId: string;
}) {
  return (
    <article className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 transition-colors hover:border-indigo-400/20">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-500/10">
          <ListFilter className="size-4 text-cyan-300" />
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-sm font-medium text-zinc-200">
            {segment.name}
          </h2>

          <p className="mt-1 text-xs text-zinc-600">
            {segment.ruleCount ?? segment.rules.length}{' '}
            {segment.rules.length === 1
              ? 'rule'
              : 'rules'}{' '}
            · All must match
          </p>
        </div>
      </div>

      <p className="mt-5 min-h-10 text-sm leading-5 text-zinc-600">
        {segment.description ||
          'No segment description provided.'}
      </p>

      <div className="mt-5 space-y-2">
        {segment.rules.slice(0, 3).map((rule, index) => (
          <RulePreview
            key={`${rule.type}-${index}`}
            rule={rule}
          />
        ))}

        {segment.rules.length > 3 && (
          <p className="px-2 text-xs text-zinc-700">
            +{segment.rules.length - 3} more rules
          </p>
        )}
      </div>

      <div className="mt-5 flex items-end justify-between gap-4 border-t border-white/[0.06] pt-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-700">
            Updated
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            {formatDate(segment.updatedAt)}
          </p>
        </div>
      </div>

      <SegmentActions
        segment={segment}
        projectId={projectId}
      />
    </article>
  );
}

function RulePreview({
  rule,
}: {
  rule: SegmentRule;
}) {
  const attribute =
    rule.type === 'custom'
      ? rule.attribute || 'custom'
      : rule.type;

  const value = Array.isArray(rule.value)
    ? rule.value.join(', ')
    : rule.value;

  return (
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2">
      <Braces className="size-3.5 shrink-0 text-indigo-300" />

      <code className="min-w-0 truncate text-[11px] text-zinc-500">
        <span className="text-cyan-300">
          {attribute}
        </span>{' '}
        <span className="text-zinc-700">
          {formatOperator(rule.operator)}
        </span>{' '}
        <span className="text-fuchsia-300">
          {value}
        </span>
      </code>
    </div>
  );
}

interface CreateSegmentDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateSegmentDialog({
  projectId,
  open,
  onOpenChange,
}: CreateSegmentDialogProps) {
  const queryClient = useQueryClient();
  const createMutation = useCreateSegment();

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<SegmentFormValues>({
    resolver: zodResolver(createSegmentFormSchema),
    defaultValues: {
      name: '',
      description: '',
      rules: [
        {
          type: 'email',
          attribute: '',
          operator: 'contains',
          value: '',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'rules',
  });

  const rules = watch('rules');

  const closeDialog = () => {
    reset();
    onOpenChange(false);
  };

  const onSubmit = async (
    values: SegmentFormValues
  ) => {
    const rules: SegmentRule[] = values.rules.map(
      (rule) => ({
        type: rule.type,
        operator: rule.operator,

        value:
          rule.operator === 'in'
            ? rule.value
                .split(',')
                .map((value) => value.trim())
                .filter(Boolean)
            : rule.value.trim(),

        ...(rule.type === 'custom'
          ? {
              attribute: rule.attribute?.trim(),
            }
          : {}),
      })
    );

    try {
      await createMutation.mutateAsync({
        projectId,
        data: {
          name: values.name.trim(),
          description:
            values.description?.trim() || null,
          rules,
        },
      });

      await queryClient.invalidateQueries({
        queryKey:
          getGetProjectSegmentsQueryKey(projectId),
      });

      toast.success('Segment created');
      closeDialog();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to create the segment.'
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
        New segment
      </DialogTrigger>

      <DialogContent className="max-h-[88vh] overflow-y-auto border border-white/[0.09] bg-[#0d111a] text-white ring-0 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create segment</DialogTitle>

          <DialogDescription className="text-zinc-500">
            Every rule uses AND logic. A user must match all
            rules to enter this segment.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-5 py-3">
            <div className="space-y-2">
              <Label htmlFor="segment-name">
                Name
              </Label>

              <Input
                id="segment-name"
                placeholder="Beta users"
                className="border-white/10 bg-white/[0.035]"
                {...register('name')}
              />

              {errors.name && (
                <p className="text-xs text-red-400">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="segment-description">
                Description
                <span className="ml-1 text-zinc-600">
                  (optional)
                </span>
              </Label>

              <textarea
                id="segment-description"
                rows={3}
                maxLength={500}
                placeholder="Users enrolled in beta testing"
                className="w-full resize-none rounded-md border border-white/10 bg-white/[0.035] px-3 py-2 text-sm text-zinc-300 outline-none placeholder:text-zinc-700 focus:border-indigo-400/40"
                {...register('description')}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Targeting rules</Label>

                  <p className="mt-1 text-xs text-zinc-600">
                    All rules must evaluate to true.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="border-white/10 bg-transparent text-zinc-400"
                  onClick={() =>
                    append({
                      type: 'email',
                      attribute: '',
                      operator: 'equals',
                      value: '',
                    })
                  }
                >
                  <Plus className="size-4" />
                  Add rule
                </Button>
              </div>

              <div className="mt-4 space-y-3">
                {fields.map((field, index) => {
                  const rule = rules[index];
                  const isCustom =
                    rule?.type === 'custom';
                  const isList =
                    rule?.operator === 'in';

                  return (
                    <div
                      key={field.id}
                      className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-zinc-500">
                          Rule {index + 1}
                        </p>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-zinc-600 hover:text-red-400"
                          disabled={fields.length === 1}
                          onClick={() => remove(index)}
                        >
                          <Trash2 className="size-4" />
                          <span className="sr-only">
                            Remove rule
                          </span>
                        </Button>
                      </div>

                      <div className="mt-3 grid gap-3 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label
                            htmlFor={`rule-${index}-type`}
                          >
                            Attribute type
                          </Label>

                          <select
                            id={`rule-${index}-type`}
                            className="flex h-9 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm text-zinc-300 outline-none focus:border-indigo-400/40"
                            {...register(
                              `rules.${index}.type`
                            )}
                          >
                            <option
                              value="email"
                              className="bg-[#0d111a]"
                            >
                              Email
                            </option>

                            <option
                              value="country"
                              className="bg-[#0d111a]"
                            >
                              Country
                            </option>

                            <option
                              value="custom"
                              className="bg-[#0d111a]"
                            >
                              Custom
                            </option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor={`rule-${index}-operator`}
                          >
                            Operator
                          </Label>

                          <select
                            id={`rule-${index}-operator`}
                            className="flex h-9 w-full rounded-md border border-white/10 bg-black/20 px-3 text-sm text-zinc-300 outline-none focus:border-indigo-400/40"
                            {...register(
                              `rules.${index}.operator`
                            )}
                          >
                            <option
                              value="equals"
                              className="bg-[#0d111a]"
                            >
                              Equals
                            </option>

                            <option
                              value="contains"
                              className="bg-[#0d111a]"
                            >
                              Contains
                            </option>

                            <option
                              value="in"
                              className="bg-[#0d111a]"
                            >
                              Is one of
                            </option>

                            <option
                              value="startsWith"
                              className="bg-[#0d111a]"
                            >
                              Starts with
                            </option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label
                            htmlFor={`rule-${index}-value`}
                          >
                            {isList
                              ? 'Values'
                              : 'Value'}
                          </Label>

                          <Input
                            id={`rule-${index}-value`}
                            placeholder={
                              isList
                                ? 'IN, US, GB'
                                : 'example.com'
                            }
                            className="border-white/10 bg-black/20"
                            {...register(
                              `rules.${index}.value`
                            )}
                          />

                          {errors.rules?.[index]
                            ?.value && (
                            <p className="text-xs text-red-400">
                              {
                                errors.rules[index]?.value
                                  ?.message
                              }
                            </p>
                          )}
                        </div>
                      </div>

                      {isCustom && (
                        <div className="mt-3 space-y-2">
                          <Label
                            htmlFor={`rule-${index}-attribute`}
                          >
                            Custom attribute
                          </Label>

                          <Input
                            id={`rule-${index}-attribute`}
                            placeholder="plan"
                            className="border-white/10 bg-black/20 font-mono"
                            {...register(
                              `rules.${index}.attribute`
                            )}
                          />

                          {errors.rules?.[index]
                            ?.attribute && (
                            <p className="text-xs text-red-400">
                              {
                                errors.rules[index]
                                  ?.attribute?.message
                              }
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {typeof errors.rules?.message ===
                'string' && (
                <p className="mt-2 text-xs text-red-400">
                  {errors.rules.message}
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
              onClick={closeDialog}
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
              Create segment
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
          Choose a project before managing segments.
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

function EmptySegments({
  onCreate,
}: {
  onCreate: () => void;
}) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.015] px-6 text-center">
      <ListFilter className="size-8 text-cyan-300" />

      <h2 className="mt-5 text-base font-medium text-white">
        Create your first segment
      </h2>

      <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-600">
        Build reusable audiences from email, country, or
        custom user attributes.
      </p>

      <Button
        className="mt-6 bg-indigo-500 text-white hover:bg-indigo-400"
        onClick={onCreate}
      >
        <Plus className="size-4" />
        New segment
      </Button>
    </div>
  );
}

function SegmentsSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-72 rounded-2xl bg-white/[0.04]"
        />
      ))}
    </div>
  );
}

function formatOperator(operator: string): string {
  if (operator === 'startsWith') {
    return 'starts with';
  }

  if (operator === 'in') {
    return 'is one of';
  }

  return operator;
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}