'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Check,
  LoaderCircle,
  Rocket,
  ShieldAlert,
} from 'lucide-react';
import { toast } from 'sonner';

import { getGetDashboardStatsQueryKey } from '@/api/generated/dashboard/dashboard';
import {
  getGetEnvironmentQueryKey,
  getGetEnvironmentsQueryKey,
  useGetEnvironment,
  usePromoteFlags,
} from '@/api/generated/environments/environments';
import { getGetFlagsByProjectIdQueryKey } from '@/api/generated/feature-flags/feature-flags';
import type { EnvironmentSummary } from '@/api/generated/models';
import { getGetProjectByIdQueryKey } from '@/api/generated/projects/projects';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getApiErrorMessage } from '@/utils/get-api-error-message';

interface PromoteFlagsDialogProps {
  projectId: string;
  environments: EnvironmentSummary[];
}

export function PromoteFlagsDialog({
  projectId,
  environments,
}: PromoteFlagsDialogProps) {
  const [open, setOpen] = useState(false);
  const [sourceId, setSourceId] = useState('');
  const [targetId, setTargetId] = useState('');
  const [selectedFlagIds, setSelectedFlagIds] =
    useState<string[]>([]);
  const [productionConfirmed, setProductionConfirmed] =
    useState(false);

  const queryClient = useQueryClient();
  const promoteMutation = usePromoteFlags();

  const sourceQuery = useGetEnvironment(sourceId, {
    query: {
      enabled: Boolean(sourceId) && open,
      staleTime: 30 * 1000,
    },
  });

  const sourceFlags =
    sourceQuery.data?.data?.flags ?? [];

  const targetEnvironment = environments.find(
    (environment) => environment.id === targetId
  );

  const targetsProduction =
    targetEnvironment?.type === 'production';

  const resetDialog = () => {
    setSourceId('');
    setTargetId('');
    setSelectedFlagIds([]);
    setProductionConfirmed(false);
  };

  const handleSourceChange = (
  value: string | null
) => {
  const nextSourceId = value ?? '';

  setSourceId(nextSourceId);
  setSelectedFlagIds([]);

  if (targetId === nextSourceId) {
    setTargetId('');
    setProductionConfirmed(false);
  }
};

const handleTargetChange = (
  value: string | null
) => {
  setTargetId(value ?? '');
  setProductionConfirmed(false);
};

  const toggleFlag = (flagId: string) => {
    setSelectedFlagIds((current) =>
      current.includes(flagId)
        ? current.filter((id) => id !== flagId)
        : [...current, flagId]
    );
  };

  const selectAllFlags = () => {
    const availableIds = sourceFlags
      .map((flag) => flag.id)
      .filter((id): id is string => Boolean(id));

    setSelectedFlagIds((current) =>
      current.length === availableIds.length
        ? []
        : availableIds
    );
  };

  const handlePromotion = async () => {
    if (!sourceId || !targetId) {
      toast.error(
        'Select source and target environments.'
      );
      return;
    }

    if (selectedFlagIds.length === 0) {
      toast.error(
        'Select at least one feature flag.'
      );
      return;
    }

    if (targetsProduction && !productionConfirmed) {
      toast.error(
        'Confirm the production promotion first.'
      );
      return;
    }

    try {
      const response =
        await promoteMutation.mutateAsync({
          sourceEnvId: sourceId,
          targetEnvId: targetId,
          data: {
            flagIds: selectedFlagIds,
          },
        });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            getGetEnvironmentQueryKey(sourceId),
        }),
        queryClient.invalidateQueries({
          queryKey:
            getGetEnvironmentQueryKey(targetId),
        }),
        queryClient.invalidateQueries({
          queryKey:
            getGetEnvironmentsQueryKey(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey:
            getGetFlagsByProjectIdQueryKey(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey:
            getGetProjectByIdQueryKey(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey: getGetDashboardStatsQueryKey(),
        }),
      ]);

      const promoted =
        response.data?.promoted ??
        selectedFlagIds.length;

      toast.success(
        `${promoted} ${
          promoted === 1 ? 'flag' : 'flags'
        } promoted successfully`
      );

      setOpen(false);
      resetDialog();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to promote feature flags.'
        )
      );
    }
  };

  const canPromote =
    Boolean(sourceId) &&
    Boolean(targetId) &&
    selectedFlagIds.length > 0 &&
    (!targetsProduction || productionConfirmed);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && promoteMutation.isPending) return;

        setOpen(nextOpen);

        if (!nextOpen) {
          resetDialog();
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
        <Rocket className="size-4" />
        Promote
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto border border-white/[0.09] bg-[#0d111a] text-white ring-0 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Promote feature flags
          </DialogTitle>

          <DialogDescription className="text-zinc-500">
            Copy selected flag states and descriptions from
            one environment to another.
          </DialogDescription>
        </DialogHeader>

        <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-400">
              Source
            </p>

            <Select
              value={sourceId || null}
              onValueChange={handleSourceChange}
            >
              <SelectTrigger className="h-10 w-full border-white/10 bg-white/[0.035]">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>

              <SelectContent className="border border-white/[0.09] bg-[#0d111a] text-white">
                {environments.map((environment) => {
                  if (!environment.id) return null;

                  return (
                    <SelectItem
                      key={environment.id}
                      value={environment.id}
                      className="focus:bg-white/[0.06]"
                    >
                      {environment.name ??
                        'Unnamed environment'}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <ArrowRight className="mx-auto mb-3 hidden size-4 text-zinc-700 sm:block" />

          <div className="space-y-2">
            <p className="text-xs font-medium text-zinc-400">
              Target
            </p>

            <Select
              value={targetId || null}
              onValueChange={handleTargetChange}
              disabled={!sourceId}
            >
              <SelectTrigger className="h-10 w-full border-white/10 bg-white/[0.035]">
                <SelectValue placeholder="Select target" />
              </SelectTrigger>

              <SelectContent className="border border-white/[0.09] bg-[#0d111a] text-white">
                {environments
                  .filter(
                    (environment) =>
                      environment.id !== sourceId
                  )
                  .map((environment) => {
                    if (!environment.id) return null;

                    return (
                      <SelectItem
                        key={environment.id}
                        value={environment.id}
                        className="focus:bg-white/[0.06]"
                      >
                        {environment.name ??
                          'Unnamed environment'}
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
          </div>
        </div>

        {targetsProduction && (
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-amber-400/15 bg-amber-500/[0.06] p-4">
            <input
              type="checkbox"
              checked={productionConfirmed}
              className="mt-0.5 size-4 accent-amber-500"
              onChange={(event) =>
                setProductionConfirmed(
                  event.target.checked
                )
              }
            />

            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-300" />

            <span>
              <span className="block text-xs font-medium text-amber-200">
                Confirm production promotion
              </span>

              <span className="mt-1 block text-xs leading-5 text-amber-200/50">
                These changes can affect live users.
              </span>
            </span>
          </label>
        )}

        <div className="rounded-xl border border-white/[0.07]">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-4 py-3">
            <div>
              <p className="text-xs font-medium text-zinc-300">
                Feature flags
              </p>

              <p className="mt-1 text-[11px] text-zinc-600">
                {selectedFlagIds.length} selected
              </p>
            </div>

            {sourceFlags.length > 0 && (
              <button
                type="button"
                className="text-xs text-indigo-300 hover:text-indigo-200"
                onClick={selectAllFlags}
              >
                {selectedFlagIds.length ===
                sourceFlags.filter((flag) => flag.id)
                  .length
                  ? 'Clear all'
                  : 'Select all'}
              </button>
            )}
          </div>

          {!sourceId ? (
            <FlagMessage message="Select a source environment." />
          ) : sourceQuery.isPending ? (
            <div className="flex min-h-40 items-center justify-center">
              <LoaderCircle className="size-5 animate-spin text-indigo-300" />
            </div>
          ) : sourceQuery.isError ? (
            <FlagMessage message="Unable to load source flags." />
          ) : sourceFlags.length === 0 ? (
            <FlagMessage message="The source environment has no flags." />
          ) : (
            <div className="max-h-72 divide-y divide-white/[0.06] overflow-y-auto">
              {sourceFlags.map((flag, index) => {
                if (!flag.id) return null;

                const selected =
                  selectedFlagIds.includes(flag.id);

                return (
                  <button
                    key={flag.id ?? index}
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.025]"
                    onClick={() =>
                      toggleFlag(flag.id!)
                    }
                  >
                    <span
                      className={
                        selected
                          ? 'flex size-5 items-center justify-center rounded-md bg-indigo-500 text-white'
                          : 'size-5 rounded-md border border-white/10'
                      }
                    >
                      {selected && (
                        <Check className="size-3" />
                      )}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-zinc-300">
                        {flag.name ?? 'Unnamed flag'}
                      </p>

                      <p className="mt-1 truncate font-mono text-xs text-zinc-600">
                        {flag.key ?? 'no_key'}
                      </p>
                    </div>

                    <span
                      className={
                        flag.enabled
                          ? 'text-xs text-emerald-400'
                          : 'text-xs text-zinc-600'
                      }
                    >
                      {flag.enabled ? 'On' : 'Off'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-white/[0.07] pt-4">
          <Button
            className="bg-indigo-500 text-white hover:bg-indigo-400"
            disabled={
              !canPromote ||
              promoteMutation.isPending
            }
            onClick={handlePromotion}
          >
            {promoteMutation.isPending ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Rocket className="size-4" />
            )}
            Promote selected flags
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FlagMessage({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex min-h-40 items-center justify-center px-6 text-center text-sm text-zinc-600">
      {message}
    </div>
  );
}