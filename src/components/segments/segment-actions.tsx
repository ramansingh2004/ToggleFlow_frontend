'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import type {
  Segment,
  SegmentRule,
} from '@/api/generated/models';
import {
  getGetProjectSegmentsQueryKey,
  useDeleteSegment,
  useTestSegment,
  useUpdateSegment,
} from '@/api/generated/segments/segments';
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

interface SegmentActionsProps {
  segment: Segment;
  projectId: string;
}

interface EditableRule {
  type: SegmentRule['type'];
  attribute: string;
  operator: SegmentRule['operator'];
  value: string;
}

export function SegmentActions({
  segment,
  projectId,
}: SegmentActionsProps) {
  return (
    <div className="mt-5 flex items-center gap-2 border-t border-border pt-4">
      <EditSegmentDialog
        segment={segment}
        projectId={projectId}
      />

      <TestSegmentDialog segment={segment} />

      <DeleteSegmentDialog
        segment={segment}
        projectId={projectId}
      />
    </div>
  );
}

function EditSegmentDialog({
  segment,
  projectId,
}: SegmentActionsProps) {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateSegment();

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(segment.name);
  const [description, setDescription] = useState(
    segment.description ?? ''
  );
  const [rules, setRules] = useState<EditableRule[]>(
    toEditableRules(segment.rules)
  );

  const resetForm = () => {
    setName(segment.name);
    setDescription(segment.description ?? '');
    setRules(toEditableRules(segment.rules));
  };

  const updateRule = (
    index: number,
    values: Partial<EditableRule>
  ) => {
    setRules((current) =>
      current.map((rule, ruleIndex) =>
        ruleIndex === index
          ? { ...rule, ...values }
          : rule
      )
    );
  };

  const removeRule = (index: number) => {
    if (rules.length <= 1) return;

    setRules((current) =>
      current.filter(
        (_, ruleIndex) => ruleIndex !== index
      )
    );
  };

  const validate = (): string | null => {
    if (!name.trim()) {
      return 'Segment name is required.';
    }

    if (name.trim().length > 100) {
      return 'Segment name must be at most 100 characters.';
    }

    if (description.length > 500) {
      return 'Description must be at most 500 characters.';
    }

    if (rules.length === 0) {
      return 'Add at least one targeting rule.';
    }

    for (const [index, rule] of rules.entries()) {
      if (
        rule.type === 'custom' &&
        !rule.attribute.trim()
      ) {
        return `Rule ${index + 1} requires a custom attribute.`;
      }

      if (!rule.value.trim()) {
        return `Rule ${index + 1} requires a value.`;
      }

      if (
        rule.operator === 'in' &&
        parseList(rule.value).length === 0
      ) {
        return `Rule ${index + 1} requires at least one list value.`;
      }
    }

    return null;
  };

  const saveSegment = async () => {
    const validationError = validate();

    if (validationError) {
      toast.error(validationError);
      return;
    }

    const payloadRules: SegmentRule[] = rules.map(
      (rule) => ({
        type: rule.type,
        operator: rule.operator,
        value:
          rule.operator === 'in'
            ? parseList(rule.value)
            : rule.value.trim(),
        ...(rule.type === 'custom'
          ? { attribute: rule.attribute.trim() }
          : {}),
      })
    );

    try {
      await updateMutation.mutateAsync({
        segmentId: segment.id,
        data: {
          name: name.trim(),
          description: description.trim() || null,
          rules: payloadRules,
        },
      });

      await queryClient.invalidateQueries({
        queryKey:
          getGetProjectSegmentsQueryKey(projectId),
      });

      toast.success('Segment updated');
      setOpen(false);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to update the segment.'
        )
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && updateMutation.isPending) return;

        if (nextOpen) {
          resetForm();
        }

        setOpen(nextOpen);
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="border-border bg-transparent text-foreground-secondary"
          />
        }
      >
        <Pencil className="size-3.5" />
        Edit
      </DialogTrigger>

      <DialogContent className="max-h-[88vh] overflow-y-auto border border-border bg-popover text-foreground ring-0 sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit segment</DialogTitle>

          <DialogDescription className="text-muted-foreground">
            All targeting rules use AND logic.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-3">
          <div className="space-y-2">
            <Label htmlFor={`segment-${segment.id}-name`}>
              Name
            </Label>

            <Input
              id={`segment-${segment.id}-name`}
              value={name}
              maxLength={100}
              className="border-border bg-card"
              onChange={(event) =>
                setName(event.target.value)
              }
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor={`segment-${segment.id}-description`}
            >
              Description
            </Label>

            <textarea
              id={`segment-${segment.id}-description`}
              rows={3}
              maxLength={500}
              value={description}
              className="w-full resize-none rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground-secondary outline-none focus:border-primary/30"
              onChange={(event) =>
                setDescription(event.target.value)
              }
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Rules</Label>

                <p className="mt-1 text-xs text-muted-foreground">
                  Every rule must match.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                className="border-border bg-transparent text-foreground-secondary"
                onClick={() =>
                  setRules((current) => [
                    ...current,
                    {
                      type: 'email',
                      attribute: '',
                      operator: 'equals',
                      value: '',
                    },
                  ])
                }
              >
                <Plus className="size-4" />
                Add rule
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {rules.map((rule, index) => (
                <EditableRuleCard
                  key={index}
                  index={index}
                  rule={rule}
                  canRemove={rules.length > 1}
                  onChange={(values) =>
                    updateRule(index, values)
                  }
                  onRemove={() => removeRule(index)}
                />
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="border-border bg-card">
          <Button
            type="button"
            variant="outline"
            className="border-border bg-transparent"
            disabled={updateMutation.isPending}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>

          <Button
            type="button"
            className="bg-primary text-primary-foreground hover:bg-primary-hover"
            disabled={updateMutation.isPending}
            onClick={saveSegment}
          >
            {updateMutation.isPending && (
              <LoaderCircle className="size-4 animate-spin" />
            )}
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditableRuleCard({
  index,
  rule,
  canRemove,
  onChange,
  onRemove,
}: {
  index: number;
  rule: EditableRule;
  canRemove: boolean;
  onChange: (values: Partial<EditableRule>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          Rule {index + 1}
        </p>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 text-muted-foreground hover:text-destructive"
          disabled={!canRemove}
          onClick={onRemove}
        >
          <Trash2 className="size-4" />
          <span className="sr-only">Remove rule</span>
        </Button>
      </div>

      <div className="mt-3 grid gap-3 md:grid-cols-3">
        <RuleField label="Attribute type">
          <select
            value={rule.type}
            className={selectClasses}
            onChange={(event) =>
              onChange({
                type: event.target
                  .value as SegmentRule['type'],
              })
            }
          >
            <option value="email">Email</option>
            <option value="country">Country</option>
            <option value="custom">Custom</option>
          </select>
        </RuleField>

        <RuleField label="Operator">
          <select
            value={rule.operator}
            className={selectClasses}
            onChange={(event) =>
              onChange({
                operator: event.target
                  .value as SegmentRule['operator'],
              })
            }
          >
            <option value="equals">Equals</option>
            <option value="contains">Contains</option>
            <option value="in">Is one of</option>
            <option value="startsWith">
              Starts with
            </option>
          </select>
        </RuleField>

        <RuleField
          label={
            rule.operator === 'in'
              ? 'Values'
              : 'Value'
          }
        >
          <Input
            value={rule.value}
            placeholder={
              rule.operator === 'in'
                ? 'IN, US, GB'
                : 'example.com'
            }
            className="border-border bg-background"
            onChange={(event) =>
              onChange({
                value: event.target.value,
              })
            }
          />
        </RuleField>
      </div>

      {rule.type === 'custom' && (
        <div className="mt-3">
          <RuleField label="Custom attribute">
            <Input
              value={rule.attribute}
              placeholder="plan"
              className="border-border bg-background font-mono"
              onChange={(event) =>
                onChange({
                  attribute: event.target.value,
                })
              }
            />
          </RuleField>
        </div>
      )}
    </div>
  );
}

function TestSegmentDialog({
  segment,
}: {
  segment: Segment;
}) {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState(() =>
    createExampleContext(segment)
  );
  const [result, setResult] =
    useState<boolean | null>(null);

  const testMutation = useTestSegment();

  const runTest = async () => {
    let userContext: Record<string, unknown>;

    try {
      const parsed: unknown = JSON.parse(context);

      if (
        !parsed ||
        typeof parsed !== 'object' ||
        Array.isArray(parsed)
      ) {
        throw new Error();
      }

      userContext = parsed as Record<string, unknown>;
    } catch {
      toast.error(
        'User context must be a valid JSON object.'
      );
      return;
    }

    try {
      const response = await testMutation.mutateAsync({
        segmentId: segment.id,
        data: {
          userContext,
        },
      });

      setResult(Boolean(response.data?.matches));
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to test the segment.'
        )
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && testMutation.isPending) return;

        if (nextOpen) {
          setContext(createExampleContext(segment));
          setResult(null);
        }

        setOpen(nextOpen);
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="border-border bg-transparent text-foreground-secondary"
          />
        }
      >
        <FlaskConical className="size-3.5" />
        Test
      </DialogTrigger>

      <DialogContent className="border border-border bg-popover text-foreground ring-0 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Test {segment.name}</DialogTitle>

          <DialogDescription className="text-muted-foreground">
            Provide a sample user context as JSON.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-3">
          <Label htmlFor={`test-${segment.id}`}>
            User context
          </Label>

          <textarea
            id={`test-${segment.id}`}
            rows={10}
            value={context}
            spellCheck={false}
            className="w-full resize-none rounded-xl border border-border bg-background p-4 font-mono text-xs leading-6 text-primary outline-none focus:border-primary/30"
            onChange={(event) => {
              setContext(event.target.value);
              setResult(null);
            }}
          />

          {result !== null && (
            <div
              className={
                result
                  ? 'flex items-center gap-3 rounded-xl border border-success/30 bg-success-subtle p-4'
                  : 'flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive-subtle p-4'
              }
            >
              {result ? (
                <CheckCircle2 className="size-5 text-success" />
              ) : (
                <XCircle className="size-5 text-destructive" />
              )}

              <div>
                <p
                  className={
                    result
                      ? 'text-sm text-success'
                      : 'text-sm text-destructive'
                  }
                >
                  {result
                    ? 'User matches this segment'
                    : 'User does not match this segment'}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Every rule must evaluate to true.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="border-border bg-card">
          <Button
            type="button"
            variant="outline"
            className="border-border bg-transparent"
            disabled={testMutation.isPending}
            onClick={() => setOpen(false)}
          >
            Close
          </Button>

          <Button
            type="button"
            className="bg-primary text-primary-foreground hover:bg-primary-hover"
            disabled={testMutation.isPending}
            onClick={runTest}
          >
            {testMutation.isPending && (
              <LoaderCircle className="size-4 animate-spin" />
            )}
            Run test
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteSegmentDialog({
  segment,
  projectId,
}: SegmentActionsProps) {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteSegment();
  const [open, setOpen] = useState(false);

  const deleteSegment = async () => {
    try {
      await deleteMutation.mutateAsync({
        segmentId: segment.id,
      });

      await queryClient.invalidateQueries({
        queryKey:
          getGetProjectSegmentsQueryKey(projectId),
      });

      toast.success('Segment deleted');
      setOpen(false);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to delete the segment.'
        )
      );
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && deleteMutation.isPending) return;
        setOpen(nextOpen);
      }}
    >
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto text-muted-foreground hover:text-destructive"
          />
        }
      >
        <Trash2 className="size-4" />
        <span className="sr-only">Delete segment</span>
      </AlertDialogTrigger>

      <AlertDialogContent className="border border-border bg-popover text-foreground ring-0">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive-subtle">
            <AlertTriangle className="text-destructive" />
          </AlertDialogMedia>

          <AlertDialogTitle>
            Delete {segment.name}?
          </AlertDialogTitle>

          <AlertDialogDescription className="text-muted-foreground">
            This targeting segment will be permanently
            removed. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="border-border bg-card">
          <AlertDialogCancel
            className="border-border bg-transparent"
            disabled={deleteMutation.isPending}
          >
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={deleteSegment}
          >
            {deleteMutation.isPending && (
              <LoaderCircle className="size-4 animate-spin" />
            )}
            Delete segment
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function RuleField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function toEditableRules(
  rules: SegmentRule[]
): EditableRule[] {
  return rules.map((rule) => ({
    type: rule.type,
    attribute: rule.attribute ?? '',
    operator: rule.operator,
    value: Array.isArray(rule.value)
      ? rule.value.join(', ')
      : rule.value,
  }));
}

function parseList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function createExampleContext(
  segment: Segment
): string {
  const context: Record<string, string> = {};

  for (const rule of segment.rules) {
    const attribute =
      rule.type === 'custom'
        ? rule.attribute ?? 'custom'
        : rule.type;

    const ruleValue = Array.isArray(rule.value)
      ? rule.value[0] ?? ''
      : rule.value;

    context[attribute] = ruleValue;
  }

  return JSON.stringify(context, null, 2);
}

const selectClasses =
  'flex h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground-secondary outline-none focus:border-primary/30';