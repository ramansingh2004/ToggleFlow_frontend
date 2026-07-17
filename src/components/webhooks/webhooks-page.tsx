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
            <p className="text-sm font-medium text-primary">
              Integrations
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground">
              Webhooks
            </h1>

            <p className="mt-3 text-sm text-muted-foreground">
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
            <div className="rounded-2xl border border-destructive/30 bg-destructive-subtle py-16 text-center text-sm text-muted-foreground">
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
    <article className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-elevated">
            <Webhook className="size-4 text-foreground-secondary" />
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-sm font-medium text-foreground">
              {webhook.name ?? 'Unnamed webhook'}
            </h2>

            <p className="mt-1 truncate text-xs text-muted-foreground">
              {webhook.url ?? ''}
            </p>
          </div>
        </div>

        <span
          className={
            webhook.active
              ? 'rounded-full border border-success/30 bg-success-subtle px-2.5 py-1 text-[10px] text-success'
              : 'rounded-full border border-border bg-surface-elevated px-2.5 py-1 text-[10px] text-muted-foreground'
          }
        >
          {webhook.active ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {(webhook.events ?? []).map((event) => (
          <span
            key={event}
            className="rounded-lg border border-border bg-card px-2 py-1 font-mono text-[10px] text-muted-foreground"
          >
            {event}
          </span>
        ))}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Last triggered
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            {webhook.lastTriggeredAt
              ? formatDate(webhook.lastTriggeredAt)
              : 'Never'}
          </p>
        </div>

        <div>
          <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
            Failures
          </p>

          <p
            className={
              (webhook.failureCount ?? 0) > 0
                ? 'mt-1 text-xs text-destructive'
                : 'mt-1 text-xs text-muted-foreground'
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
          <Button className="h-9 bg-primary px-4 text-primary-foreground hover:bg-primary-hover" />
        }
      >
        <Plus className="size-4" />
        New webhook
      </DialogTrigger>

      <DialogContent
        showCloseButton={!createdWebhook}
        className="max-h-[85vh] overflow-y-auto border border-border bg-popover text-foreground ring-0 sm:max-w-lg"
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

              <DialogDescription className="text-muted-foreground">
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
                  <Label htmlFor="webhook-url">
                    Endpoint URL
                  </Label>

                  <Input
                    id="webhook-url"
                    type="url"
                    placeholder="https://example.com/webhooks/toggleflow"
                    className="border-border bg-card"
                    {...register('url')}
                  />

                  {errors.url && (
                    <p className="text-xs text-destructive">
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
                              ? 'flex items-center gap-3 rounded-xl border border-primary/30 bg-primary-subtle px-3 py-3 text-left'
                              : 'flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 text-left hover:bg-surface-elevated'
                          }
                          onClick={() =>
                            toggleEvent(event)
                          }
                        >
                          <span
                            className={
                              selected
                                ? 'flex size-5 items-center justify-center rounded-md bg-primary'
                                : 'size-5 rounded-md border border-border'
                            }
                          >
                            {selected && (
                              <Check className="size-3 text-foreground" />
                            )}
                          </span>

                          <span className="text-xs text-foreground-secondary">
                            {eventLabels[event]}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {errors.events && (
                    <p className="text-xs text-destructive">
                      {errors.events.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-xl border border-border bg-card p-3">
                  <div>
                    <p className="text-sm text-foreground-secondary">
                      Active
                    </p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Begin delivering events immediately.
                    </p>
                  </div>

                  <Switch
                    checked={active}
                    className="data-checked:bg-primary"
                    onCheckedChange={(checked) =>
                      setValue('active', checked)
                    }
                  />
                </div>
              </div>

              <DialogFooter className="border-border bg-card">
                <Button
                  type="button"
                  variant="outline"
                  className="border-border bg-transparent"
                  disabled={createMutation.isPending}
                  onClick={() => onOpenChange(false)}
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

        <DialogDescription className="text-muted-foreground">
          This secret will not be displayed again.
        </DialogDescription>
      </DialogHeader>

      <div className="flex gap-3 rounded-xl border border-warning/30 bg-warning-subtle p-4">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" />

        <p className="text-xs leading-5 text-warning">
          Use this secret to verify the signature of incoming
          webhook payloads.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-background p-4">
        <code className="block break-all text-xs leading-6 text-primary">
          {webhook.secret}
        </code>
      </div>

      <DialogFooter className="border-border bg-card">
        <Button
          variant="outline"
          className="border-border bg-transparent"
          onClick={onCopy}
        >
          {copied ? (
            <Check className="size-4 text-success" />
          ) : (
            <Copy className="size-4" />
          )}
          {copied ? 'Copied' : 'Copy secret'}
        </Button>

        <Button
          className="bg-primary text-primary-foreground hover:bg-primary-hover"
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
        <FolderKanban className="mx-auto size-8 text-primary" />

        <h1 className="mt-5 text-lg text-foreground">
          Select a project
        </h1>

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

function EmptyWebhooks({
  onCreate,
}: {
  onCreate: () => void;
}) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 text-center">
      <Webhook className="size-8 text-foreground-secondary" />

      <h2 className="mt-5 text-base font-medium text-foreground">
        Create your first webhook
      </h2>

      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        Send signed event notifications to your deployment,
        monitoring, or communication systems.
      </p>

      <Button
        className="mt-6 bg-primary text-primary-foreground"
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
          className="h-64 rounded-2xl bg-surface-elevated"
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