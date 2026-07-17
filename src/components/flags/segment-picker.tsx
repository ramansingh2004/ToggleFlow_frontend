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
      <div className="h-24 animate-pulse rounded-xl bg-surface-elevated" />
    );
  }

  if (segments.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-4 text-center">
        <Layers3 className="mx-auto size-5 text-muted-foreground" />

        <p className="mt-2 text-xs text-muted-foreground">
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
            ? 'border-primary/30 bg-primary-subtle'
            : 'border-border bg-card hover:bg-surface-elevated'
        )}
        onClick={() => onChange([])}
      >
        <div>
          <p className="text-sm text-foreground-secondary">
            All users
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Do not restrict this flag by segment.
          </p>
        </div>

        {selectedIds.length === 0 && (
          <Check className="size-4 text-primary" />
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
                ? 'border-primary/30 bg-primary-subtle'
                : 'border-border bg-card hover:bg-surface-elevated'
            )}
            onClick={() => toggleSegment(segment.id)}
          >
            <div className="min-w-0">
              <p className="truncate text-sm text-foreground-secondary">
                {segment.name ?? 'Unnamed segment'}
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
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
                  ? 'border-primary/30 bg-primary text-primary-foreground'
                  : 'border-border'
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