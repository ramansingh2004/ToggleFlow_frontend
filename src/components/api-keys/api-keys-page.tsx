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
            <p className="text-sm font-medium text-indigo-300">
              Developer access
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">
              API keys
            </h1>

            <p className="mt-3 text-sm text-zinc-500">
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
            <div className="rounded-2xl border border-red-400/10 bg-red-500/[0.03] py-16 text-center text-sm text-zinc-500">
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
            <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.02]">
              <div className="hidden grid-cols-[1.1fr_1fr_130px_80px] border-b border-white/[0.07] px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-zinc-700 md:grid">
                <span>Name</span>
                <span>Key prefix</span>
                <span>Status</span>
                <span />
              </div>

              <div className="divide-y divide-white/[0.06]">
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
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-cyan-400/15 bg-cyan-500/10">
          <KeyRound className="size-4 text-cyan-300" />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-zinc-200">
            {apiKey.name || 'Unnamed key'}
          </p>

          <p className="mt-1 text-xs text-zinc-700">
            Created {formatDate(apiKey.createdAt)}
          </p>
        </div>
      </div>

      <code className="truncate text-xs text-zinc-500">
        {apiKey.prefix ?? 'unknown'}••••••••••••
      </code>

      <div>
        <span
          className={
            active
              ? 'rounded-full border border-emerald-400/15 bg-emerald-500/10 px-2.5 py-1 text-[10px] text-emerald-300'
              : expired
                ? 'rounded-full border border-amber-400/15 bg-amber-500/10 px-2.5 py-1 text-[10px] text-amber-300'
                : 'rounded-full border border-zinc-400/10 bg-zinc-500/10 px-2.5 py-1 text-[10px] text-zinc-500'
          }
        >
          {active
            ? 'Active'
            : expired
              ? 'Expired'
              : 'Revoked'}
        </span>

        {apiKey.expiresAt && (
          <p className="mt-2 text-[10px] text-zinc-700">
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
          <Button className="h-9 bg-indigo-500 px-4 text-white hover:bg-indigo-400" />
        }
      >
        <Plus className="size-4" />
        New API key
      </DialogTrigger>

      <DialogContent
        showCloseButton={!createdKey}
        className="border border-white/[0.09] bg-[#0d111a] text-white ring-0 sm:max-w-lg"
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

              <DialogDescription className="text-zinc-500">
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
                  <Label htmlFor="api-key-expiry">
                    Expiration
                    <span className="ml-1 text-zinc-600">
                      (optional)
                    </span>
                  </Label>

                  <Input
                    id="api-key-expiry"
                    type="datetime-local"
                    className="border-white/10 bg-white/[0.035]"
                    {...register('expiresAt')}
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

        <DialogDescription className="text-zinc-500">
          You will not be able to view this secret again.
        </DialogDescription>
      </DialogHeader>

      <div className="flex items-start gap-3 rounded-xl border border-amber-400/15 bg-amber-500/[0.06] p-4">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-300" />

        <p className="text-xs leading-5 text-amber-200/60">
          Copy this key now and store it in a secure
          environment variable or secrets manager.
        </p>
      </div>

      <div className="rounded-xl border border-white/[0.08] bg-black/30 p-4">
        <code className="block break-all text-xs leading-6 text-indigo-200">
          {createdKey.key}
          <p className="text-xs leading-5 text-zinc-600">
            Store this value as{' '}
            <code className="text-zinc-400">
              TOGGLEFLOW_API_KEY
            </code>{' '}
            in your server&apos;s environment configuration.
          </p>
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
          {copied ? 'Copied' : 'Copy key'}
        </Button>

        <Button
          className="bg-indigo-500 text-white hover:bg-indigo-400"
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
            className="text-zinc-600 hover:text-red-400"
          />
        }
      >
        <Trash2 className="size-4" />
        <span className="sr-only">Revoke API key</span>
      </AlertDialogTrigger>

      <AlertDialogContent className="border border-white/[0.09] bg-[#0d111a] text-white ring-0">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-red-500/10">
            <AlertTriangle className="text-red-400" />
          </AlertDialogMedia>

          <AlertDialogTitle>
            Revoke {apiKey.name || 'this API key'}?
          </AlertDialogTitle>

          <AlertDialogDescription className="text-zinc-500">
            Applications using this key will immediately lose
            access. This cannot be reversed.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="border-white/[0.07] bg-white/[0.02]">
          <AlertDialogCancel
            className="border-white/10 bg-transparent"
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
        <FolderKanban className="mx-auto size-8 text-indigo-300" />

        <h1 className="mt-5 text-lg font-medium text-white">
          Select a project
        </h1>

        <p className="mt-2 text-sm text-zinc-600">
          Choose a project before managing API keys.
        </p>

        <Link
          href="/projects"
          className="mt-6 inline-flex h-9 items-center rounded-lg bg-indigo-500 px-4 text-sm font-medium text-white"
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
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.015] px-6 text-center">
      <KeyRound className="size-8 text-indigo-300" />

      <h2 className="mt-5 text-base font-medium text-white">
        Create your first API key
      </h2>

      <p className="mt-2 max-w-sm text-sm leading-6 text-zinc-600">
        Use API keys to connect your application to the
        ToggleFlow SDK endpoints.
      </p>

      <Button
        className="mt-6 bg-indigo-500 text-white hover:bg-indigo-400"
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
          className="h-20 rounded-xl bg-white/[0.04]"
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