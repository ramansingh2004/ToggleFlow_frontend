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
            <p className="text-sm font-medium text-primary">
              Audience targeting
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground">
              Segments
            </h1>

            <p className="mt-3 text-sm text-muted-foreground">
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
            <div className="rounded-2xl border border-destructive/30 bg-destructive-subtle py-16 text-center text-sm text-muted-foreground">
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
    <article className="rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/30">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary-subtle">
          <ListFilter className="size-4 text-primary" />
        </div>

        <div className="min-w-0">
          <h2 className="truncate text-sm font-medium text-foreground">
            {segment.name}
          </h2>

          <p className="mt-1 text-xs text-muted-foreground">
            {segment.ruleCount ?? segment.rules.length}{' '}
            {segment.rules.length === 1
              ? 'rule'
              : 'rules'}{' '}
            · All must match
          </p>
        </div>
      </div>

      <p className="mt-5 min-h-10 text-sm leading-5 text-muted-foreground">
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
          <p className="px-2 text-xs text-muted-foreground">
            +{segment.rules.length - 3} more rules
          </p>
        )}
      </div>

      <div className="mt-5 flex items-end justify-between gap-4 border-t border-border pt-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Updated
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
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
    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
      <Braces className="size-3.5 shrink-0 text-primary" />

      <code className="min-w-0 truncate text-[11px] text-muted-foreground">
        <span className="text-primary">
          {attribute}
        </span>{' '}
        <span className="text-muted-foreground">
          {formatOperator(rule.operator)}
        </span>{' '}
        <span className="text-foreground-secondary">
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
          <Button className="h-9 bg-primary px-4 text-primary-foreground hover:bg-primary-hover" />
        }
      >
        <Plus className="size-4" />
        New segment
      </DialogTrigger>

      <DialogContent className="max-h-[88vh] overflow-y-auto border border-border bg-popover text-foreground ring-0 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create segment</DialogTitle>

          <DialogDescription className="text-muted-foreground">
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
                className="border-border bg-card"
                {...register('name')}
              />

              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="segment-description">
                Description
                <span className="ml-1 text-muted-foreground">
                  (optional)
                </span>
              </Label>

              <textarea
                id="segment-description"
                rows={3}
                maxLength={500}
                placeholder="Users enrolled in beta testing"
                className="w-full resize-none rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground-secondary outline-none placeholder:text-muted-foreground focus:border-primary/30"
                {...register('description')}
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Targeting rules</Label>

                  <p className="mt-1 text-xs text-muted-foreground">
                    All rules must evaluate to true.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="border-border bg-transparent text-foreground-secondary"
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
                      className="rounded-xl border border-border bg-card p-4"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground">
                          Rule {index + 1}
                        </p>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
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
                            className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground-secondary outline-none focus:border-primary/30"
                            {...register(
                              `rules.${index}.type`
                            )}
                          >
                            <option
                              value="email"
                              className="bg-popover"
                            >
                              Email
                            </option>

                            <option
                              value="country"
                              className="bg-popover"
                            >
                              Country
                            </option>

                            <option
                              value="custom"
                              className="bg-popover"
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
                            className="flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground-secondary outline-none focus:border-primary/30"
                            {...register(
                              `rules.${index}.operator`
                            )}
                          >
                            <option
                              value="equals"
                              className="bg-popover"
                            >
                              Equals
                            </option>

                            <option
                              value="contains"
                              className="bg-popover"
                            >
                              Contains
                            </option>

                            <option
                              value="in"
                              className="bg-popover"
                            >
                              Is one of
                            </option>

                            <option
                              value="startsWith"
                              className="bg-popover"
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
                            className="border-border bg-background"
                            {...register(
                              `rules.${index}.value`
                            )}
                          />

                          {errors.rules?.[index]
                            ?.value && (
                            <p className="text-xs text-destructive">
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
                            className="border-border bg-background font-mono"
                            {...register(
                              `rules.${index}.attribute`
                            )}
                          />

                          {errors.rules?.[index]
                            ?.attribute && (
                            <p className="text-xs text-destructive">
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
                <p className="mt-2 text-xs text-destructive">
                  {errors.rules.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="border-border bg-card">
            <Button
              type="button"
              variant="outline"
              className="border-border bg-transparent"
              disabled={createMutation.isPending}
              onClick={closeDialog}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary-hover"
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
        <FolderKanban className="mx-auto size-8 text-primary" />

        <h1 className="mt-5 text-lg text-foreground">
          Select a project
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Choose a project before managing segments.
        </p>

        <Link
          href="/projects"
          className="mt-6 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm text-primary-foreground"
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
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 text-center">
      <ListFilter className="size-8 text-primary" />

      <h2 className="mt-5 text-base font-medium text-foreground">
        Create your first segment
      </h2>

      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        Build reusable audiences from email, country, or
        custom user attributes.
      </p>

      <Button
        className="mt-6 bg-primary text-primary-foreground hover:bg-primary-hover"
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
          className="h-72 rounded-2xl bg-surface-elevated"
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