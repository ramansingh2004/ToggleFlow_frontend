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
import type { ProjectDetail } from '@/api/generated/models';
import {
  getGetProjectByIdQueryKey,
  getGetProjectsQueryKey,
  useDeleteProject,
  useUpdateProject,
} from '@/api/generated/projects/projects';
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
  createProjectSchema,
  type CreateProjectFormValues,
} from '@/schemas/project.schema';
import { getApiErrorMessage } from '@/utils/get-api-error-message';
import { useUiStore } from '@/store/ui-store';

interface ProjectActionsProps {
  project: ProjectDetail;
  projectId: string;
}

export function ProjectActions({
  project,
  projectId,
}: ProjectActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <EditProjectDialog
        project={project}
        projectId={projectId}
      />

      <DeleteProjectDialog
        projectName={project.name ?? 'this project'}
        projectId={projectId}
      />
    </div>
  );
}

function EditProjectDialog({
  project,
  projectId,
}: ProjectActionsProps) {
  const [open, setOpen] = useState(false);

  const queryClient = useQueryClient();
  const updateMutation = useUpdateProject();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: project.name ?? '',
      description: project.description ?? '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        name: project.name ?? '',
        description: project.description ?? '',
      });
    }
  }, [
    open,
    project.description,
    project.name,
    reset,
  ]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && updateMutation.isPending) return;
    setOpen(nextOpen);
  };

  const onSubmit = async (
    values: CreateProjectFormValues
  ) => {
    try {
      await updateMutation.mutateAsync({
        projectId,
        data: {
          name: values.name.trim(),
          description:
            values.description.trim() || null,
        },
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            getGetProjectByIdQueryKey(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey: getGetProjectsQueryKey(),
        }),
        queryClient.invalidateQueries({
          queryKey: getGetDashboardStatsQueryKey(),
        }),
      ]);

      toast.success('Project updated');
      setOpen(false);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to update the project.'
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
            variant="outline"
            className="border-white/10 bg-white/[0.025]"
          />
        }
      >
        <Pencil className="size-4" />
        Edit project
      </DialogTrigger>

      <DialogContent className="border border-white/[0.09] bg-[#0d111a] text-white ring-0 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit project</DialogTitle>

          <DialogDescription className="text-zinc-500">
            Update the project name and description.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-5 py-3">
            <div className="space-y-2">
              <Label htmlFor="edit-project-name">
                Project name
              </Label>

              <Input
                id="edit-project-name"
                className="h-10 border-white/10 bg-white/[0.035]"
                {...register('name')}
              />

              {errors.name && (
                <p className="text-xs text-red-400">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-project-description">
                Description
              </Label>

              <Textarea
                id="edit-project-description"
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
              onClick={() => handleOpenChange(false)}
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

interface DeleteProjectDialogProps {
  projectId: string;
  projectName: string;
}

function DeleteProjectDialog({
  projectId,
  projectName,
}: DeleteProjectDialogProps) {
  const [open, setOpen] = useState(false);

  const router = useRouter();
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteProject();

  const selectedProjectId = useUiStore(
    (state) => state.selectedProjectId
  );

  const selectProject = useUiStore(
    (state) => state.selectProject
  );
  
  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({
        projectId,
      });

      if (selectedProjectId === projectId) {
        selectProject(null);
      }

      queryClient.removeQueries({
        queryKey: getGetProjectByIdQueryKey(projectId),
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getGetProjectsQueryKey(),
        }),
        queryClient.invalidateQueries({
          queryKey: getGetDashboardStatsQueryKey(),
        }),
      ]);

      toast.success('Project deleted');
      setOpen(false);
      router.replace('/projects');
      router.refresh();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to delete the project.'
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
            Delete {projectName}?
          </AlertDialogTitle>

          <AlertDialogDescription className="text-zinc-500">
            This will remove the project and make its
            associated resources unavailable. This action
            cannot be undone from the dashboard.
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
            Delete project
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}