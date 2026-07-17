'use client';

import { useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  Check,
  Copy,
  FolderKanban,
  KeyRound,
  LoaderCircle,
  Plus,
  ShieldAlert,
  Trash2,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  getGetApiKeysByProjectIdQueryKey,
  useCreateApiKey,
  useGetApiKeysByProjectId,
  useRevokeApiKey,
} from '@/api/generated/api-keys/api-keys';
import { getGetDashboardStatsQueryKey } from '@/api/generated/dashboard/dashboard';
import type {
  ApiKeySummary,
  CreateApiKeyData,
} from '@/api/generated/models';
import { getGetProjectByIdQueryKey } from '@/api/generated/projects/projects';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
  createApiKeySchema,
  type CreateApiKeyFormValues,
} from '@/schemas/api-key.schema';
import { useUiStore } from '@/store/ui-store';
import { getApiErrorMessage } from '@/utils/get-api-error-message';
import { SdkQuickstart } from '@/components/api-keys/sdk-quickstart';

export function ApiKeysPage() {
  const selectedProjectId = useUiStore(
    (state) => state.selectedProjectId
  );

  const [createOpen, setCreateOpen] =
    useState(false);

  const apiKeysQuery = useGetApiKeysByProjectId(
    selectedProjectId ?? '',
    {
      query: {
        enabled: Boolean(selectedProjectId),
        staleTime: 30 * 1000,
      },
    }
  );

  const apiKeys = apiKeysQuery.data?.data ?? [];

  if (!selectedProjectId) {
    return <NoProjectSelected />;
  }

  return (
    <main className="p-5 sm:p-7 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-primary">
              Developer access
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground">
              API keys
            </h1>

            <p className="mt-3 text-sm text-muted-foreground">
              Authenticate SDK requests to your selected
              project.
            </p>
          </div>

          <CreateApiKeyDialog
            projectId={selectedProjectId}
            open={createOpen}
            onOpenChange={setCreateOpen}
          />
        </div>

        <div className="mt-8">
          <SdkQuickstart projectId={selectedProjectId} />
        </div>

        <div className="mt-8">
          {apiKeysQuery.isPending && <ApiKeysSkeleton />}

          {apiKeysQuery.isError && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive-subtle py-16 text-center text-sm text-muted-foreground">
              Unable to load API keys.
            </div>
          )}

          {apiKeysQuery.isSuccess &&
            apiKeys.length === 0 && (
              <EmptyApiKeys
                onCreate={() => setCreateOpen(true)}
              />
            )}

          {apiKeys.length > 0 && (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="hidden grid-cols-[1.1fr_1fr_130px_80px] border-b border-border px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground md:grid">
                <span>Name</span>
                <span>Key prefix</span>
                <span>Status</span>
                <span />
              </div>

              <div className="divide-y divide-border">
                {apiKeys.map((apiKey, index) => (
                  <ApiKeyRow
                    key={apiKey.id ?? index}
                    apiKey={apiKey}
                    projectId={selectedProjectId}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function ApiKeyRow({
  apiKey,
  projectId,
}: {
  apiKey: ApiKeySummary;
  projectId: string;
}) {
  const expired = isExpired(apiKey.expiresAt);
  const active = Boolean(apiKey.isActive) && !expired;

  return (
    <div className="grid gap-4 px-5 py-4 md:grid-cols-[1.1fr_1fr_130px_80px] md:items-center">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary-subtle">
          <KeyRound className="size-4 text-primary" />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {apiKey.name || 'Unnamed key'}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Created {formatDate(apiKey.createdAt)}
          </p>
        </div>
      </div>

      <code className="truncate text-xs text-muted-foreground">
        {apiKey.prefix ?? 'unknown'}••••••••••••
      </code>

      <div>
        <span
          className={
            active
              ? 'rounded-full border border-success/30 bg-success-subtle px-2.5 py-1 text-[10px] text-success'
              : expired
                ? 'rounded-full border border-warning/30 bg-warning-subtle px-2.5 py-1 text-[10px] text-warning'
                : 'rounded-full border border-border bg-surface-elevated px-2.5 py-1 text-[10px] text-muted-foreground'
          }
        >
          {active
            ? 'Active'
            : expired
              ? 'Expired'
              : 'Revoked'}
        </span>

        {apiKey.expiresAt && (
          <p className="mt-2 text-[10px] text-muted-foreground">
            Expires {formatDate(apiKey.expiresAt)}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        {apiKey.id && apiKey.isActive && (
          <RevokeApiKeyDialog
            apiKey={apiKey}
            projectId={projectId}
          />
        )}
      </div>
    </div>
  );
}

interface CreateApiKeyDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateApiKeyDialog({
  projectId,
  open,
  onOpenChange,
}: CreateApiKeyDialogProps) {
  const [createdKey, setCreatedKey] =
    useState<CreateApiKeyData | null>(null);
  const [copied, setCopied] = useState(false);

  const queryClient = useQueryClient();
  const createMutation = useCreateApiKey();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateApiKeyFormValues>({
    resolver: zodResolver(createApiKeySchema),
    defaultValues: {
      name: '',
      expiresAt: '',
    },
  });

  const resetDialog = () => {
    reset();
    setCreatedKey(null);
    setCopied(false);
  };

  const onSubmit = async (
    values: CreateApiKeyFormValues
  ) => {
    try {
      const response =
        await createMutation.mutateAsync({
          projectId,
          data: {
            name: values.name.trim() || undefined,
            expiresAt: values.expiresAt
              ? new Date(values.expiresAt).toISOString()
              : undefined,
          },
        });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            getGetApiKeysByProjectIdQueryKey(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey:
            getGetProjectByIdQueryKey(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey: getGetDashboardStatsQueryKey(),
        }),
      ]);

      if (!response.data?.key) {
        throw new Error(
          'The API key was created but its secret was not returned.'
        );
      }

      setCreatedKey(response.data);
      toast.success('API key created');
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to create the API key.'
        )
      );
    }
  };

  const copyKey = async () => {
    if (!createdKey?.key) return;

    try {
      await navigator.clipboard.writeText(
        createdKey.key
      );
      setCopied(true);
      toast.success('API key copied');
    } catch {
      toast.error('Unable to copy the API key.');
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && createMutation.isPending) return;

        onOpenChange(nextOpen);

        if (!nextOpen) {
          resetDialog();
        }
      }}
    >
      <DialogTrigger
        render={
          <Button className="h-9 bg-primary px-4 text-primary-foreground hover:bg-primary-hover" />
        }
      >
        <Plus className="size-4" />
        New API key
      </DialogTrigger>

      <DialogContent
        showCloseButton={!createdKey}
        className="border border-border bg-popover text-foreground ring-0 sm:max-w-lg"
      >
        {createdKey ? (
          <CreatedKeyView
            createdKey={createdKey}
            copied={copied}
            onCopy={copyKey}
            onDone={() => {
              onOpenChange(false);
              resetDialog();
            }}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create API key</DialogTitle>

              <DialogDescription className="text-muted-foreground">
                The complete key will only be displayed once.
              </DialogDescription>
            </DialogHeader>

            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
            >
              <div className="space-y-5 py-3">
                <div className="space-y-2">
                  <Label htmlFor="api-key-name">
                    Name
                  </Label>

                  <Input
                    id="api-key-name"
                    placeholder="Production SDK"
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
                  <Label htmlFor="api-key-expiry">
                    Expiration
                    <span className="ml-1 text-muted-foreground">
                      (optional)
                    </span>
                  </Label>

                  <Input
                    id="api-key-expiry"
                    type="datetime-local"
                    className="border-border bg-card"
                    {...register('expiresAt')}
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
                  Create key
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CreatedKeyView({
  createdKey,
  copied,
  onCopy,
  onDone,
}: {
  createdKey: CreateApiKeyData;
  copied: boolean;
  onCopy: () => void;
  onDone: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>Save your API key</DialogTitle>

        <DialogDescription className="text-muted-foreground">
          You will not be able to view this secret again.
        </DialogDescription>
      </DialogHeader>

      <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning-subtle p-4">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" />

        <p className="text-xs leading-5 text-warning">
          Copy this key now and store it in a secure
          environment variable or secrets manager.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-background p-4">
        <code className="block break-all text-xs leading-6 text-primary">
          {createdKey.key}
          <p className="text-xs leading-5 text-muted-foreground">
            Store this value as{' '}
            <code className="text-foreground-secondary">
              TOGGLEFLOW_API_KEY
            </code>{' '}
            in your server&apos;s environment configuration.
          </p>
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
          {copied ? 'Copied' : 'Copy key'}
        </Button>

        <Button
          className="bg-primary text-primary-foreground hover:bg-primary-hover"
          onClick={onDone}
        >
          I saved the key
        </Button>
      </DialogFooter>
    </>
  );
}

function RevokeApiKeyDialog({
  apiKey,
  projectId,
}: {
  apiKey: ApiKeySummary;
  projectId: string;
}) {
  const [open, setOpen] = useState(false);

  const queryClient = useQueryClient();
  const revokeMutation = useRevokeApiKey();

  const revokeKey = async () => {
    if (!apiKey.id) return;

    try {
      await revokeMutation.mutateAsync({
        apiKeyId: apiKey.id,
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            getGetApiKeysByProjectIdQueryKey(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey:
            getGetProjectByIdQueryKey(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey: getGetDashboardStatsQueryKey(),
        }),
      ]);

      toast.success('API key revoked');
      setOpen(false);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to revoke the API key.'
        )
      );
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && revokeMutation.isPending) return;
        setOpen(nextOpen);
      }}
    >
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
          />
        }
      >
        <Trash2 className="size-4" />
        <span className="sr-only">Revoke API key</span>
      </AlertDialogTrigger>

      <AlertDialogContent className="border border-border bg-popover text-foreground ring-0">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive-subtle">
            <AlertTriangle className="text-destructive" />
          </AlertDialogMedia>

          <AlertDialogTitle>
            Revoke {apiKey.name || 'this API key'}?
          </AlertDialogTitle>

          <AlertDialogDescription className="text-muted-foreground">
            Applications using this key will immediately lose
            access. This cannot be reversed.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="border-border bg-card">
          <AlertDialogCancel
            className="border-border bg-transparent"
            disabled={revokeMutation.isPending}
          >
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            variant="destructive"
            disabled={revokeMutation.isPending}
            onClick={revokeKey}
          >
            {revokeMutation.isPending && (
              <LoaderCircle className="size-4 animate-spin" />
            )}
            Revoke key
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function NoProjectSelected() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
      <div className="max-w-sm text-center">
        <FolderKanban className="mx-auto size-8 text-primary" />

        <h1 className="mt-5 text-lg font-medium text-foreground">
          Select a project
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Choose a project before managing API keys.
        </p>

        <Link
          href="/projects"
          className="mt-6 inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          View projects
        </Link>
      </div>
    </main>
  );
}

function EmptyApiKeys({
  onCreate,
}: {
  onCreate: () => void;
}) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 text-center">
      <KeyRound className="size-8 text-primary" />

      <h2 className="mt-5 text-base font-medium text-foreground">
        Create your first API key
      </h2>

      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        Use API keys to connect your application to the
        ToggleFlow SDK endpoints.
      </p>

      <Button
        className="mt-6 bg-primary text-primary-foreground hover:bg-primary-hover"
        onClick={onCreate}
      >
        <Plus className="size-4" />
        New API key
      </Button>
    </div>
  );
}

function ApiKeysSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-20 rounded-xl bg-surface-elevated"
        />
      ))}
    </div>
  );
}

function isExpired(value?: string | null): boolean {
  if (!value) return false;

  const date = new Date(value);
  return !Number.isNaN(date.getTime()) &&
    date.getTime() < Date.now();
}

function formatDate(value?: string | null): string {
  if (!value) return 'Never';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}