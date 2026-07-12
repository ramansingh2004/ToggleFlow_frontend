'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FlaskConical,
  LoaderCircle,
  Trash2,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';

import { getGetDashboardStatsQueryKey } from '@/api/generated/dashboard/dashboard';
import type {
  WebhookEvent,
  WebhookSummary,
} from '@/api/generated/models';
import { getGetProjectByIdQueryKey } from '@/api/generated/projects/projects';
import {
  getGetWebhookHistoryQueryKey,
  getGetWebhooksQueryKey,
  useDeleteWebhook,
  useGetWebhookHistory,
  useTestWebhook,
} from '@/api/generated/webhooks/webhooks';
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { getApiErrorMessage } from '@/utils/get-api-error-message';

interface WebhookActionsProps {
  webhook: WebhookSummary;
  projectId: string;
}

export function WebhookActions({
  webhook,
  projectId,
}: WebhookActionsProps) {
  if (!webhook.id) return null;

  return (
    <div className="mt-4 flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
      <TestWebhookButton
        webhookId={webhook.id}
        projectId={projectId}
      />

      <WebhookHistoryDialog
        webhookId={webhook.id}
        webhookName={webhook.name ?? 'Webhook'}
      />

      <DeleteWebhookDialog
        webhookId={webhook.id}
        webhookName={webhook.name ?? 'this webhook'}
        projectId={projectId}
      />
    </div>
  );
}

function TestWebhookButton({
  webhookId,
  projectId,
}: {
  webhookId: string;
  projectId: string;
}) {
  const queryClient = useQueryClient();
  const testMutation = useTestWebhook();

  const testWebhook = async () => {
    try {
      const response =
        await testMutation.mutateAsync({
          webhookId,
        });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getGetWebhooksQueryKey(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey:
            getGetWebhookHistoryQueryKey(webhookId),
        }),
      ]);

      if (response.data?.success) {
        toast.success(
          `Test delivered successfully${
            response.data.statusCode
              ? ` (${response.data.statusCode})`
              : ''
          }`
        );
      } else {
        toast.error(
          response.data?.error ??
            'The webhook endpoint rejected the test.'
        );
      }
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to test the webhook.'
        )
      );
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="border-white/[0.08] bg-white/[0.025]"
      disabled={testMutation.isPending}
      onClick={testWebhook}
    >
      {testMutation.isPending ? (
        <LoaderCircle className="size-3.5 animate-spin" />
      ) : (
        <FlaskConical className="size-3.5" />
      )}
      Send test
    </Button>
  );
}

function WebhookHistoryDialog({
  webhookId,
  webhookName,
}: {
  webhookId: string;
  webhookName: string;
}) {
  const [open, setOpen] = useState(false);

  const historyQuery = useGetWebhookHistory(
    webhookId,
    {
      query: {
        enabled: open,
        staleTime: 15 * 1000,
      },
    }
  );

  const history = historyQuery.data?.data;
  const statistics = history?.statistics;
  const events = history?.recent ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="border-white/[0.08] bg-white/[0.025]"
          />
        }
      >
        <Activity className="size-3.5" />
        History
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto border border-white/[0.09] bg-[#0d111a] text-white ring-0 sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {webhookName} delivery history
          </DialogTitle>

          <DialogDescription className="text-zinc-500">
            The twenty most recent webhook delivery attempts.
          </DialogDescription>
        </DialogHeader>

        {historyQuery.isPending ? (
          <HistorySkeleton />
        ) : historyQuery.isError ? (
          <div className="py-16 text-center text-sm text-zinc-600">
            Unable to load delivery history.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <HistoryMetric
                label="Total"
                value={statistics?.total ?? 0}
              />

              <HistoryMetric
                label="Successful"
                value={statistics?.successful ?? 0}
                color="text-emerald-300"
              />

              <HistoryMetric
                label="Failed"
                value={statistics?.failed ?? 0}
                color="text-red-400"
              />

              <HistoryMetric
                label="Success rate"
                value={`${Math.round(
                  statistics?.successRate ?? 0
                )}%`}
                color="text-indigo-300"
              />
            </div>

            {events.length === 0 ? (
              <div className="mt-4 rounded-xl border border-white/[0.07] py-16 text-center text-sm text-zinc-600">
                No deliveries recorded yet.
              </div>
            ) : (
              <div className="mt-4 divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-white/[0.07]">
                {events.map((event, index) => (
                  <HistoryEvent
                    key={event.id ?? index}
                    event={event}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function HistoryMetric({
  label,
  value,
  color = 'text-zinc-200',
}: {
  label: string;
  value: number | string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
      <p className={`text-lg font-semibold ${color}`}>
        {value}
      </p>

      <p className="mt-1 text-[10px] uppercase tracking-[0.1em] text-zinc-700">
        {label}
      </p>
    </div>
  );
}

function HistoryEvent({
  event,
}: {
  event: WebhookEvent;
}) {
  return (
    <div className="flex items-start gap-3 px-4 py-4">
      {event.success ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
      ) : (
        <XCircle className="mt-0.5 size-4 shrink-0 text-red-400" />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <code className="text-xs text-zinc-300">
            {event.event ?? 'unknown.event'}
          </code>

          <span className="font-mono text-xs text-zinc-600">
            HTTP {event.statusCode ?? 0}
          </span>
        </div>

        {event.error && (
          <p className="mt-2 text-xs leading-5 text-red-400/70">
            {event.error}
          </p>
        )}

        <p className="mt-2 text-[10px] text-zinc-700">
          {formatDate(
            event.deliveredAt ?? event.createdAt
          )}
        </p>
      </div>
    </div>
  );
}

function DeleteWebhookDialog({
  webhookId,
  webhookName,
  projectId,
}: {
  webhookId: string;
  webhookName: string;
  projectId: string;
}) {
  const [open, setOpen] = useState(false);

  const queryClient = useQueryClient();
  const deleteMutation = useDeleteWebhook();

  const deleteWebhook = async () => {
    try {
      await deleteMutation.mutateAsync({
        webhookId,
      });

      queryClient.removeQueries({
        queryKey:
          getGetWebhookHistoryQueryKey(webhookId),
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getGetWebhooksQueryKey(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey:
            getGetProjectByIdQueryKey(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey: getGetDashboardStatsQueryKey(),
        }),
      ]);

      toast.success('Webhook deleted');
      setOpen(false);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to delete the webhook.'
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
            size="sm"
            className="ml-auto text-zinc-600 hover:text-red-400"
          />
        }
      >
        <Trash2 className="size-3.5" />
        Delete
      </AlertDialogTrigger>

      <AlertDialogContent className="border border-white/[0.09] bg-[#0d111a] text-white ring-0">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-red-500/10">
            <AlertTriangle className="text-red-400" />
          </AlertDialogMedia>

          <AlertDialogTitle>
            Delete {webhookName}?
          </AlertDialogTitle>

          <AlertDialogDescription className="text-zinc-500">
            ToggleFlow will stop sending events to this
            endpoint. Existing delivery history will also
            become unavailable.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="border-white/[0.07] bg-white/[0.02]">
          <AlertDialogCancel
            className="border-white/10 bg-transparent"
            disabled={deleteMutation.isPending}
          >
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            variant="destructive"
            disabled={deleteMutation.isPending}
            onClick={deleteWebhook}
          >
            {deleteMutation.isPending && (
              <LoaderCircle className="size-4 animate-spin" />
            )}
            Delete webhook
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function HistorySkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton
            key={index}
            className="h-20 bg-white/[0.04]"
          />
        ))}
      </div>

      <Skeleton className="h-72 bg-white/[0.04]" />
    </div>
  );
}

function formatDate(
  value?: string | null
): string {
  if (!value) return 'Unknown';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  return new Intl.DateTimeFormat('en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}