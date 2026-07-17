'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  LoaderCircle,
  Target,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  getGetFlagsByProjectIdQueryKey,
  useUpdateFlag,
} from '@/api/generated/feature-flags/feature-flags';
import type { 
    FeatureFlagListResponse, 
    FeatureFlagSummary 
} from '@/api/generated/models';
import { getGetProjectByIdQueryKey } from '@/api/generated/projects/projects';
import { useGetProjectSegments } from '@/api/generated/segments/segments';
import { SegmentPicker } from '@/components/flags/segment-picker';
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
import { getApiErrorMessage } from '@/utils/get-api-error-message';

interface SegmentTargetingDialogProps {
  flag: FeatureFlagSummary;
  projectId: string;
}

export function SegmentTargetingDialog({
  flag,
  projectId,
}: SegmentTargetingDialogProps) {
  const queryClient = useQueryClient();

  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] =
    useState<string[]>([]);

  const updateMutation = useUpdateFlag();

  const segmentsQuery = useGetProjectSegments(
    projectId,
    {
      query: {
        enabled: open,
        staleTime: 30 * 1000,
      },
    }
  );

  const segments =
    segmentsQuery.data?.data ?? [];

  const handleOpenChange = (
    nextOpen: boolean
  ) => {
    if (!nextOpen && updateMutation.isPending) {
      return;
    }

    if (nextOpen) {
    const cachedFlags =
      queryClient.getQueryData<FeatureFlagListResponse>(
        getGetFlagsByProjectIdQueryKey(
          projectId
        )
      );

    const cachedFlag =
      cachedFlags?.data?.find(
        (currentFlag) =>
          currentFlag.id === flag.id
      );

    setSelectedIds(
      cachedFlag?.segmentIds ??
        flag.segmentIds ??
        []
    );
  }

    setOpen(nextOpen);
  };

  const saveTargeting = async () => {
    if (!flag.id) return;

    try {
      const response =
  await updateMutation.mutateAsync({
    flagId: flag.id,
    data: {
      segmentIds: selectedIds,
    },
  });

const savedSegmentIds =
  response.data?.segmentIds ??
  [...selectedIds];

const flagsQueryKey =
  getGetFlagsByProjectIdQueryKey(
    projectId
  );

// Update the visible flag immediately instead of waiting
// for a background refetch.
queryClient.setQueryData<FeatureFlagListResponse>(
  flagsQueryKey,
  (current) => {
    if (!current?.data) {
      return current;
    }

    return {
      ...current,
      data: current.data.map(
        (currentFlag) =>
          currentFlag.id === flag.id
            ? {
                ...currentFlag,
                segmentIds:
                  savedSegmentIds,
              }
            : currentFlag
      ),
    };
  }
);

setSelectedIds(savedSegmentIds);

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: flagsQueryKey,
        }),
        queryClient.invalidateQueries({
          queryKey:
            getGetProjectByIdQueryKey(
              projectId
            ),
        }),
      ]);

      toast.success(
        selectedIds.length === 0
          ? 'Flag is available to all users'
          : `Flag targeted to ${selectedIds.length} ${
              selectedIds.length === 1
                ? 'segment'
                : 'segments'
            }`
      );

      setOpen(false);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to update segment targeting.'
        )
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={
              (flag.segmentIds?.length ?? 0) > 0
                ? 'text-primary hover:bg-primary-subtle hover:text-primary'
                : 'text-muted-foreground hover:bg-primary-subtle hover:text-primary'
            }
            disabled={!flag.id}
            title="Configure segment targeting"
          />
        }
      >
        <Target className="size-4" />

        <span className="sr-only">
          Configure segment targeting
        </span>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto border border-border bg-popover text-foreground ring-0 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Segment targeting
          </DialogTitle>

          <DialogDescription className="text-muted-foreground">
            Control which users are eligible for{' '}
            {flag.name ?? 'this feature'}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs text-muted-foreground">
              Evaluation order
            </p>

            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              The user must match at least one selected
              segment. The rollout percentage is applied
              after the segment match.
            </p>
          </div>

          <SegmentPicker
            segments={segments}
            selectedIds={selectedIds}
            loading={segmentsQuery.isPending}
            disabled={updateMutation.isPending}
            onChange={setSelectedIds}
          />

          {segmentsQuery.isError && (
            <p className="text-xs text-destructive">
              Unable to load project segments.
            </p>
          )}
        </div>

        <DialogFooter className="border-border bg-card">
          <Button
            type="button"
            variant="outline"
            className="border-border bg-transparent"
            disabled={updateMutation.isPending}
            onClick={() => handleOpenChange(false)}
          >
            Cancel
          </Button>

          <Button
            type="button"
            className="bg-primary text-primary-foreground hover:bg-primary-hover"
            disabled={
              updateMutation.isPending ||
              segmentsQuery.isPending ||
              segmentsQuery.isError
            }
            onClick={saveTargeting}
          >
            {updateMutation.isPending && (
              <LoaderCircle className="size-4 animate-spin" />
            )}

            Save targeting
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}