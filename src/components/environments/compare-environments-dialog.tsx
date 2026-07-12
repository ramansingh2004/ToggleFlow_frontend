'use client';

import { useState } from 'react';
import {
  ArrowRightLeft,
  Check,
  LoaderCircle,
  Minus,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { useCompareEnvironments } from '@/api/generated/environments/environments';
import type {
  CompareEnvironmentsResponseData,
  EnvironmentSummary,
} from '@/api/generated/models';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getApiErrorMessage } from '@/utils/get-api-error-message';

interface CompareEnvironmentsDialogProps {
  projectId: string;
  environments: EnvironmentSummary[];
}

export function CompareEnvironmentsDialog({
  projectId,
  environments,
}: CompareEnvironmentsDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<
    string[]
  >([]);
  const [result, setResult] =
    useState<CompareEnvironmentsResponseData | null>(
      null
    );

  const compareMutation = useCompareEnvironments();

  const toggleEnvironment = (environmentId: string) => {
    setResult(null);

    setSelectedIds((current) =>
      current.includes(environmentId)
        ? current.filter((id) => id !== environmentId)
        : [...current, environmentId]
    );
  };

  const handleCompare = async () => {
    if (selectedIds.length < 2) {
      toast.error(
        'Select at least two environments to compare.'
      );
      return;
    }

    try {
      const response =
        await compareMutation.mutateAsync({
          projectId,
          data: {
            environmentIds: selectedIds,
          },
        });

      setResult(response.data ?? null);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to compare environments.'
        )
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && compareMutation.isPending) return;

        setOpen(nextOpen);

        if (!nextOpen) {
          setSelectedIds([]);
          setResult(null);
        }
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="outline"
            className="h-9 border-white/10 bg-white/[0.025]"
            disabled={environments.length < 2}
          />
        }
      >
        <ArrowRightLeft className="size-4" />
        Compare
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto border border-white/[0.09] bg-[#0d111a] text-white ring-0 sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            Compare environments
          </DialogTitle>

          <DialogDescription className="text-zinc-500">
            Select two or more environments to compare
            feature availability.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-3">
          {environments.map((environment) => {
            if (!environment.id) return null;

            const selected = selectedIds.includes(
              environment.id
            );

            return (
              <button
                key={environment.id}
                type="button"
                className={
                  selected
                    ? 'rounded-xl border border-indigo-400/30 bg-indigo-500/10 p-3 text-left'
                    : 'rounded-xl border border-white/[0.08] bg-white/[0.025] p-3 text-left transition-colors hover:bg-white/[0.05]'
                }
                onClick={() =>
                  toggleEnvironment(environment.id!)
                }
              >
                <div className="flex items-center justify-between">
                  <span className="truncate text-sm font-medium text-zinc-200">
                    {environment.name ??
                      'Unnamed environment'}
                  </span>

                  <span
                    className={
                      selected
                        ? 'flex size-5 items-center justify-center rounded-full bg-indigo-500 text-white'
                        : 'size-5 rounded-full border border-white/10'
                    }
                  >
                    {selected && (
                      <Check className="size-3" />
                    )}
                  </span>
                </div>

                <p className="mt-2 text-xs capitalize text-zinc-600">
                  {environment.type ??
                    'development'}
                </p>
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.07] pt-4">
          <p className="text-xs text-zinc-600">
            {selectedIds.length} selected
          </p>

          <Button
            className="bg-indigo-500 text-white hover:bg-indigo-400"
            disabled={
              selectedIds.length < 2 ||
              compareMutation.isPending
            }
            onClick={handleCompare}
          >
            {compareMutation.isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <ArrowRightLeft className="size-4" />
            )}
            Compare environments
          </Button>
        </div>

        {result && (
          <ComparisonResult result={result} />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ComparisonResult({
  result,
}: {
  result: CompareEnvironmentsResponseData;
}) {
  const environments = result.environments ?? [];
  const comparison = result.comparison ?? [];

  return (
    <div className="border-t border-white/[0.07] pt-5">
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-sm font-medium text-white">
            Comparison result
          </h3>

          <p className="mt-1 text-xs text-zinc-600">
            {result.totalFlags ?? comparison.length}{' '}
            unique feature flags
          </p>
        </div>
      </div>

      {comparison.length === 0 ? (
        <div className="mt-4 rounded-xl border border-white/[0.07] bg-white/[0.02] py-12 text-center text-sm text-zinc-600">
          No feature flags were found.
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-xl border border-white/[0.07]">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/[0.07] bg-white/[0.025]">
                <th className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-600">
                  Flag key
                </th>

                {environments.map(
                  (environment, index) => (
                    <th
                      key={environment.id ?? index}
                      className="px-4 py-3 text-[10px] font-medium uppercase tracking-[0.12em] text-zinc-600"
                    >
                      {environment.name ??
                        'Environment'}
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-white/[0.06]">
              {comparison.map((item) => (
                <tr key={item.flagKey}>
                  <td className="px-4 py-3">
                    <code className="text-xs text-zinc-400">
                      {item.flagKey}
                    </code>
                  </td>

                  {environments.map(
                    (environment, index) => {
                      const state =
                        item.states.find(
                          (currentState) =>
                            currentState.environmentId ===
                            environment.id
                        );

                      return (
                        <td
                          key={
                            environment.id ?? index
                          }
                          className="px-4 py-3"
                        >
                          <ComparisonState
                            enabled={
                              state?.enabled ?? false
                            }
                            missing={
                              state?.missing ?? true
                            }
                          />
                        </td>
                      );
                    }
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ComparisonState({
  enabled,
  missing,
}: {
  enabled: boolean;
  missing: boolean;
}) {
  if (missing) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-zinc-700">
        <Minus className="size-3.5" />
        Missing
      </span>
    );
  }

  if (enabled) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400">
        <Check className="size-3.5" />
        Enabled
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500">
      <X className="size-3.5" />
      Disabled
    </span>
  );
}