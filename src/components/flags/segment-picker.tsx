'use client';

import { Check, Layers3 } from 'lucide-react';

import type { Segment } from '@/api/generated/models';
import { cn } from '@/lib/utils';

interface SegmentPickerProps {
  segments: Segment[];
  selectedIds: string[];
  loading?: boolean;
  disabled?: boolean;
  onChange: (segmentIds: string[]) => void;
}

export function SegmentPicker({
  segments,
  selectedIds,
  loading = false,
  disabled = false,
  onChange,
}: SegmentPickerProps) {
  const toggleSegment = (segmentId: string) => {
    if (disabled) return;

    const nextIds = selectedIds.includes(segmentId)
      ? selectedIds.filter((id) => id !== segmentId)
      : [...selectedIds, segmentId];

    onChange(nextIds);
  };

  if (loading) {
    return (
      <div className="h-24 animate-pulse rounded-xl bg-white/[0.04]" />
    );
  }

  if (segments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/[0.09] bg-white/[0.02] p-4 text-center">
        <Layers3 className="mx-auto size-5 text-zinc-600" />

        <p className="mt-2 text-xs text-zinc-500">
          No segments have been created for this project.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={disabled}
        className={cn(
          'flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition-colors',
          selectedIds.length === 0
            ? 'border-indigo-400/25 bg-indigo-500/10'
            : 'border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04]'
        )}
        onClick={() => onChange([])}
      >
        <div>
          <p className="text-sm text-zinc-300">
            All users
          </p>

          <p className="mt-1 text-xs text-zinc-600">
            Do not restrict this flag by segment.
          </p>
        </div>

        {selectedIds.length === 0 && (
          <Check className="size-4 text-indigo-300" />
        )}
      </button>

      {segments.map((segment) => {
        const selected = selectedIds.includes(segment.id);

        return (
          <button
            key={segment.id}
            type="button"
            disabled={disabled}
            className={cn(
              'flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition-colors',
              selected
                ? 'border-indigo-400/25 bg-indigo-500/10'
                : 'border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04]'
            )}
            onClick={() => toggleSegment(segment.id)}
          >
            <div className="min-w-0">
              <p className="truncate text-sm text-zinc-300">
                {segment.name ?? 'Unnamed segment'}
              </p>

              <p className="mt-1 text-xs text-zinc-600">
                {segment.ruleCount ?? 0}{' '}
                {(segment.ruleCount ?? 0) === 1
                  ? 'rule'
                  : 'rules'}
              </p>
            </div>

            <span
              className={cn(
                'flex size-5 shrink-0 items-center justify-center rounded-md border',
                selected
                  ? 'border-indigo-400/30 bg-indigo-500 text-white'
                  : 'border-white/10'
              )}
            >
              {selected && (
                <Check className="size-3" />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}