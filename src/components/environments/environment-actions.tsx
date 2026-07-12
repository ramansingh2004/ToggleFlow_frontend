'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  LoaderCircle,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { getGetDashboardStatsQueryKey } from '@/api/generated/dashboard/dashboard';
import {
  getGetEnvironmentQueryKey,
  getGetEnvironmentsQueryKey,
  useDeleteEnvironment,
  useUpdateEnvironment,
} from '@/api/generated/environments/environments';
import type { EnvironmentDetail } from '@/api/generated/models';
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
import { Textarea } from '@/components/ui/textarea';
import {
  updateEnvironmentSchema,
  type UpdateEnvironmentFormValues,
} from '@/schemas/environment.schema';
import { getApiErrorMessage } from '@/utils/get-api-error-message';

interface EnvironmentActionsProps {
  environment: EnvironmentDetail;
  environmentId: string;
}

export function EnvironmentActions({
  environment,
  environmentId,
}: EnvironmentActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <EditEnvironmentDialog
        environment={environment}
        environmentId={environmentId}
      />

      {environment.type !== 'production' && (
        <DeleteEnvironmentDialog
          environmentId={environmentId}
          environmentName={
            environment.name ?? 'this environment'
          }
          projectId={environment.projectId}
        />
      )}
    </div>
  );
}

function EditEnvironmentDialog({
  environment,
  environmentId,
}: EnvironmentActionsProps) {
  const [open, setOpen] = useState(false);

  const queryClient = useQueryClient();
  const updateMutation = useUpdateEnvironment();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateEnvironmentFormValues>({
    resolver: zodResolver(updateEnvironmentSchema),
    defaultValues: {
      name: environment.name ?? '',
      description: environment.description ?? '',
    },
  });

  useEffect(() => {
    if (!open) return;

    reset({
      name: environment.name ?? '',
      description: environment.description ?? '',
    });
  }, [
    environment.description,
    environment.name,
    open,
    reset,
  ]);

  const onSubmit = async (
    values: UpdateEnvironmentFormValues
  ) => {
    try {
      await updateMutation.mutateAsync({
        environmentId,
        data: {
          name: values.name.trim(),
          description:
            values.description.trim() || null,
        },
      });

      const invalidations = [
        queryClient.invalidateQueries({
          queryKey:
            getGetEnvironmentQueryKey(environmentId),
        }),
        queryClient.invalidateQueries({
          queryKey: getGetDashboardStatsQueryKey(),
        }),
      ];

      if (environment.projectId) {
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey: getGetEnvironmentsQueryKey(
              environment.projectId
            ),
          }),
          queryClient.invalidateQueries({
            queryKey: getGetProjectByIdQueryKey(
              environment.projectId
            ),
          })
        );
      }

      await Promise.all(invalidations);

      toast.success('Environment updated');
      setOpen(false);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to update the environment.'
        )
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && updateMutation.isPending) return;
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger
        render={
          <Button
            variant="outline"
            className="border-white/10 bg-white/[0.025]"
          />
        }
      >
        <Pencil className="size-4" />
        Edit environment
      </DialogTrigger>

      <DialogContent className="border border-white/[0.09] bg-[#0d111a] text-white ring-0 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit environment</DialogTitle>

          <DialogDescription className="text-zinc-500">
            Environment type cannot be changed after
            creation.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-5 py-3">
            <div className="space-y-2">
              <Label htmlFor="edit-environment-name">
                Name
              </Label>

              <Input
                id="edit-environment-name"
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
              <Label htmlFor="edit-environment-description">
                Description
              </Label>

              <Textarea
                id="edit-environment-description"
                rows={4}
                className="resize-none border-white/10 bg-white/[0.035]"
                {...register('description')}
              />

              {errors.description && (
                <p className="text-xs text-red-400">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="border-white/[0.07] bg-white/[0.02]">
            <Button
              type="button"
              variant="outline"
              className="border-white/10 bg-transparent"
              disabled={updateMutation.isPending}
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="bg-indigo-500 text-white hover:bg-indigo-400"
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending && (
                <LoaderCircle className="size-4 animate-spin" />
              )}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface DeleteEnvironmentDialogProps {
  environmentId: string;
  environmentName: string;
  projectId?: string;
}

function DeleteEnvironmentDialog({
  environmentId,
  environmentName,
  projectId,
}: DeleteEnvironmentDialogProps) {
  const [open, setOpen] = useState(false);

  const router = useRouter();
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteEnvironment();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({
        environmentId,
      });

      queryClient.removeQueries({
        queryKey:
          getGetEnvironmentQueryKey(environmentId),
      });

      const invalidations = [
        queryClient.invalidateQueries({
          queryKey: getGetDashboardStatsQueryKey(),
        }),
      ];

      if (projectId) {
        invalidations.push(
          queryClient.invalidateQueries({
            queryKey:
              getGetEnvironmentsQueryKey(projectId),
          }),
          queryClient.invalidateQueries({
            queryKey:
              getGetProjectByIdQueryKey(projectId),
          })
        );
      }

      await Promise.all(invalidations);

      toast.success('Environment deleted');
      setOpen(false);
      router.replace('/environments');
      router.refresh();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to delete the environment.'
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
            variant="destructive"
            className="border border-red-400/10"
          />
        }
      >
        <Trash2 className="size-4" />
        Delete
      </AlertDialogTrigger>

      <AlertDialogContent className="border border-white/[0.09] bg-[#0d111a] text-white ring-0">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-red-500/10">
            <AlertTriangle className="text-red-400" />
          </AlertDialogMedia>

          <AlertDialogTitle>
            Delete {environmentName}?
          </AlertDialogTitle>

          <AlertDialogDescription className="text-zinc-500">
            Keys and environment-specific configuration may
            stop working. This action cannot be undone from
            the dashboard.
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
            onClick={handleDelete}
          >
            {deleteMutation.isPending && (
              <LoaderCircle className="size-4 animate-spin" />
            )}
            Delete environment
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}