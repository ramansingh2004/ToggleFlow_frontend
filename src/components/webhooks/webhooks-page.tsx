'use client';

import { useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  Check,
  Copy,
  FolderKanban,
  LoaderCircle,
  Plus,
  ShieldAlert,
  Webhook,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { getGetDashboardStatsQueryKey } from '@/api/generated/dashboard/dashboard';
import type {
  CreateWebhookData,
  WebhookSummary,
} from '@/api/generated/models';
import { getGetProjectByIdQueryKey } from '@/api/generated/projects/projects';
import {
  getGetWebhooksQueryKey,
  useCreateWebhook,
  useGetWebhooks,
} from '@/api/generated/webhooks/webhooks';
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
import { Switch } from '@/components/ui/switch';
import {
  createWebhookSchema,
  webhookEvents,
  type CreateWebhookFormValues,
} from '@/schemas/webhook.schema';
import { useUiStore } from '@/store/ui-store';
import { getApiErrorMessage } from '@/utils/get-api-error-message';
import { WebhookActions } from '@/components/webhooks/webhook-actions';

const eventLabels = {
  'flag.created': 'Flag created',
  'flag.updated': 'Flag updated',
  'flag.enabled': 'Flag enabled',
  'flag.disabled': 'Flag disabled',
  'flag.deleted': 'Flag deleted',
} as const;

export function WebhooksPage() {
  const selectedProjectId = useUiStore(
    (state) => state.selectedProjectId
  );

  const [createOpen, setCreateOpen] =
    useState(false);

  const webhooksQuery = useGetWebhooks(
    selectedProjectId ?? '',
    {
      query: {
        enabled: Boolean(selectedProjectId),
        staleTime: 30 * 1000,
      },
    }
  );

  const webhooks = webhooksQuery.data?.data ?? [];

  if (!selectedProjectId) {
    return <NoProjectSelected />;
  }

  return (
    <main className="p-5 sm:p-7 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-indigo-300">
              Integrations
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">
              Webhooks
            </h1>

            <p className="mt-3 text-sm text-zinc-500">
              Notify external systems when feature flags
              change.
            </p>
          </div>

          <CreateWebhookDialog
            projectId={selectedProjectId}
            open={createOpen}
            onOpenChange={setCreateOpen}
          />
        </div>

        <div className="mt-8">
          {webhooksQuery.isPending && (
            <WebhooksSkeleton />
          )}

          {webhooksQuery.isError && (
            <div className="rounded-2xl border border-red-400/10 bg-red-500/[0.03] py-16 text-center text-sm text-zinc-500">
              Unable to load webhooks.
            </div>
          )}

          {webhooksQuery.isSuccess &&
            webhooks.length === 0 && (
              <EmptyWebhooks
                onCreate={() => setCreateOpen(true)}
              />
            )}

          {webhooks.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-2">
              {webhooks.map((webhook, index) => (
                <WebhookCard
                  key={webhook.id ?? index}
                  webhook={webhook}
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

function WebhookCard({
  webhook,
  projectId,
}: {
  webhook: WebhookSummary;
  projectId: string;
}) {
  return (
    <article className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/15 bg-violet-500/10">
            <Webhook className="size-4 text-violet-300" />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-sm font-medium text-zinc-200">
              {webhook.name ?? 'Unnamed webhook'}
            </h2>

            <p className="mt-1 truncate text-xs text-zinc-600">
              {webhook.url ?? ''}
            </p>
          </div>
        </div>

        <span
          className={
            webhook.active
              ? 'rounded-full border border-emerald-400/15 bg-emerald-500/10 px-2.5 py-1 text-[10px] text-emerald-300'
              : 'rounded-full border border-zinc-400/10 bg-zinc-500/10 px-2.5 py-1 text-[10px] text-zinc-500'
          }
        >
          {webhook.active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {(webhook.events ?? []).map((event) => (
          <span
            key={event}
            className="rounded-lg border border-white/[0.07] bg-white/[0.025] px-2 py-1 font-mono text-[10px] text-zinc-500"
          >
            {event}
          </span>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-white/[0.06] pt-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-700">
            Last triggered
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            {webhook.lastTriggeredAt
              ? formatDate(webhook.lastTriggeredAt)
              : 'Never'}
          </p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-700">
            Failures
          </p>

          <p
            className={
              (webhook.failureCount ?? 0) > 0
                ? 'mt-1 text-xs text-red-400'
                : 'mt-1 text-xs text-zinc-500'
            }
          >
            {webhook.failureCount ?? 0}
          </p>
        </div>

        <WebhookActions
          webhook={webhook}
          projectId={projectId}
        />
        
      </div>
    </article>
  );
}

interface CreateWebhookDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateWebhookDialog({
  projectId,
  open,
  onOpenChange,
}: CreateWebhookDialogProps) {
  const [createdWebhook, setCreatedWebhook] =
    useState<CreateWebhookData | null>(null);
  const [copied, setCopied] = useState(false);

  const queryClient = useQueryClient();
  const createMutation = useCreateWebhook();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateWebhookFormValues>({
    resolver: zodResolver(createWebhookSchema),
    defaultValues: {
      name: '',
      url: '',
      events: [],
      active: true,
    },
  });

  const selectedEvents = watch('events');
  const active = watch('active');

  const toggleEvent = (
    event: (typeof webhookEvents)[number]
  ) => {
    const nextEvents = selectedEvents.includes(event)
      ? selectedEvents.filter(
          (current) => current !== event
        )
      : [...selectedEvents, event];

    setValue('events', nextEvents, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const resetDialog = () => {
    reset();
    setCreatedWebhook(null);
    setCopied(false);
  };

  const onSubmit = async (
    values: CreateWebhookFormValues
  ) => {
    try {
      const response =
        await createMutation.mutateAsync({
          projectId,
          data: values,
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

      if (!response.data?.secret) {
        throw new Error(
          'Webhook created, but its signing secret was not returned.'
        );
      }

      setCreatedWebhook(response.data);
      toast.success('Webhook created');
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to create the webhook.'
        )
      );
    }
  };

  const copySecret = async () => {
    if (!createdWebhook?.secret) return;

    try {
      await navigator.clipboard.writeText(
        createdWebhook.secret
      );

      setCopied(true);
      toast.success('Signing secret copied');
    } catch {
      toast.error('Unable to copy the secret.');
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && createMutation.isPending) return;

        onOpenChange(nextOpen);

        if (!nextOpen) resetDialog();
      }}
    >
      <DialogTrigger
        render={
          <Button className="h-9 bg-indigo-500 px-4 text-white hover:bg-indigo-400" />
        }
      >
        <Plus className="size-4" />
        New webhook
      </DialogTrigger>

      <DialogContent
        showCloseButton={!createdWebhook}
        className="max-h-[85vh] overflow-y-auto border border-white/[0.09] bg-[#0d111a] text-white ring-0 sm:max-w-lg"
      >
        {createdWebhook ? (
          <CreatedWebhookView
            webhook={createdWebhook}
            copied={copied}
            onCopy={copySecret}
            onDone={() => {
              onOpenChange(false);
              resetDialog();
            }}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create webhook</DialogTitle>

              <DialogDescription className="text-zinc-500">
                ToggleFlow signs each delivery using an HMAC
                secret.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              <div className="space-y-5 py-3">
                <div className="space-y-2">
                  <Label htmlFor="webhook-name">
                    Name
                  </Label>

                  <Input
                    id="webhook-name"
                    placeholder="Deployment notifications"
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
                  <Label htmlFor="webhook-url">
                    Endpoint URL
                  </Label>

                  <Input
                    id="webhook-url"
                    type="url"
                    placeholder="https://example.com/webhooks/toggleflow"
                    className="border-white/10 bg-white/[0.035]"
                    {...register('url')}
                  />

                  {errors.url && (
                    <p className="text-xs text-red-400">
                      {errors.url.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Events</Label>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {webhookEvents.map((event) => {
                      const selected =
                        selectedEvents.includes(event);

                      return (
                        <button
                          key={event}
                          type="button"
                          className={
                            selected
                              ? 'flex items-center gap-3 rounded-xl border border-indigo-400/25 bg-indigo-500/10 px-3 py-3 text-left'
                              : 'flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] px-3 py-3 text-left hover:bg-white/[0.05]'
                          }
                          onClick={() =>
                            toggleEvent(event)
                          }
                        >
                          <span
                            className={
                              selected
                                ? 'flex size-5 items-center justify-center rounded-md bg-indigo-500'
                                : 'size-5 rounded-md border border-white/10'
                            }
                          >
                            {selected && (
                              <Check className="size-3 text-white" />
                            )}
                          </span>

                          <span className="text-xs text-zinc-400">
                            {eventLabels[event]}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {errors.events && (
                    <p className="text-xs text-red-400">
                      {errors.events.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-white/[0.025] p-3">
                  <div>
                    <p className="text-sm text-zinc-300">
                      Active
                    </p>

                    <p className="mt-1 text-xs text-zinc-600">
                      Begin delivering events immediately.
                    </p>
                  </div>

                  <Switch
                    checked={active}
                    className="data-checked:bg-indigo-500"
                    onCheckedChange={(checked) =>
                      setValue('active', checked)
                    }
                  />
                </div>
              </div>

              <DialogFooter className="border-white/[0.07] bg-white/[0.02]">
                <Button
                  type="button"
                  variant="outline"
                  className="border-white/10 bg-transparent"
                  disabled={createMutation.isPending}
                  onClick={() => onOpenChange(false)}
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
                  Create webhook
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreatedWebhookView({
  webhook,
  copied,
  onCopy,
  onDone,
}: {
  webhook: CreateWebhookData;
  copied: boolean;
  onCopy: () => void;
  onDone: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Save the signing secret</DialogTitle>

        <DialogDescription className="text-zinc-500">
          This secret will not be displayed again.
        </DialogDescription>
      </DialogHeader>

      <div className="flex gap-3 rounded-xl border border-amber-400/15 bg-amber-500/[0.06] p-4">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-300" />

        <p className="text-xs leading-5 text-amber-200/60">
          Use this secret to verify the signature of incoming
          webhook payloads.
        </p>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-black/30 p-4">
        <code className="block break-all text-xs leading-6 text-indigo-200">
          {webhook.secret}
        </code>
      </div>

      <DialogFooter className="border-white/[0.07] bg-white/[0.02]">
        <Button
          variant="outline"
          className="border-white/10 bg-transparent"
          onClick={onCopy}
        >
          {copied ? (
            <Check className="size-4 text-emerald-400" />
          ) : (
            <Copy className="size-4" />
          )}
          {copied ? 'Copied' : 'Copy secret'}
        </Button>

        <Button
          className="bg-indigo-500 text-white hover:bg-indigo-400"
          onClick={onDone}
        >
          I saved the secret
        </Button>
      </DialogFooter>
    </>
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

function EmptyWebhooks({
  onCreate,
}: {
  onCreate: () => void;
}) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.015] px-6 text-center">
      <Webhook className="size-8 text-violet-300" />

      <h2 className="mt-5 text-base font-medium text-white">
        Create your first webhook
      </h2>

      <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-600">
        Send signed event notifications to your deployment,
        monitoring, or communication systems.
      </p>

      <Button
        className="mt-6 bg-indigo-500 text-white"
        onClick={onCreate}
      >
        <Plus className="size-4" />
        New webhook
      </Button>
    </div>
  );
}

function WebhooksSkeleton() {
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
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}