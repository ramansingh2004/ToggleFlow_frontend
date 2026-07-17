'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpRight,
  FolderKanban,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  ToggleLeft,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  getGetProjectsQueryKey,
  useCreateProject,
  useGetProjects,
} from '@/api/generated/projects/projects';
import type { ProjectSummary } from '@/api/generated/models';
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
import { Textarea } from '@/components/ui/textarea';
import {
  createProjectSchema,
  type CreateProjectFormValues,
} from '@/schemas/project.schema';
import { getApiErrorMessage } from '@/utils/get-api-error-message';
import { useUiStore } from '@/store/ui-store';

export function ProjectsPage() {
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] =
    useState(false);

  const projectsQuery = useGetProjects({
    query: {
      staleTime: 60 * 1000,
    },
  });

  const projects = projectsQuery.data?.data ?? [];

  const filteredProjects = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return projects;

    return projects.filter((project) => {
      return (
        project.name?.toLowerCase().includes(value) ||
        project.slug?.toLowerCase().includes(value) ||
        project.description
          ?.toLowerCase()
          .includes(value)
      );
    });
  }, [projects, search]);

  return (
    <main className="p-5 sm:p-7 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-primary">
              Workspace
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground">
              Projects
            </h1>

            <p className="mt-3 text-sm text-muted-foreground">
              Organize flags, environments, and team access by
              application.
            </p>
          </div>

          <CreateProjectDialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
          />
        </div>

        <div className="mt-8 flex items-center gap-3">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

            <Input
              value={search}
              placeholder="Search projects..."
              className="h-10 border-border bg-card pl-10 text-foreground placeholder:text-muted-foreground"
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <div className="hidden text-xs text-muted-foreground sm:block">
            {projects.length}{' '}
            {projects.length === 1 ? 'project' : 'projects'}
          </div>
        </div>

        <div className="mt-6">
          {projectsQuery.isPending && <ProjectsSkeleton />}

          {projectsQuery.isError && (
            <ProjectsError
              onRetry={() => projectsQuery.refetch()}
            />
          )}

          {projectsQuery.isSuccess &&
            projects.length === 0 && (
              <EmptyProjects
                onCreate={() => setIsCreateOpen(true)}
              />
            )}

          {projectsQuery.isSuccess &&
            projects.length > 0 &&
            filteredProjects.length === 0 && (
              <NoSearchResults search={search} />
            )}

          {projectsQuery.isSuccess &&
            filteredProjects.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredProjects.map((project, index) => (
                  <ProjectCard
                    key={project.id ?? index}
                    project={project}
                  />
                ))}
              </div>
            )}
        </div>
      </div>
    </main>
  );
}

interface CreateProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function CreateProjectDialog({
  open,
  onOpenChange,
}: CreateProjectDialogProps) {
  const queryClient = useQueryClient();
  const createMutation = useCreateProject();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateProjectFormValues>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const selectProject = useUiStore(
    (state) => state.selectProject
  );

  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen && createMutation.isPending) return;

    onOpenChange(nextOpen);

    if (!nextOpen) {
      reset();
    }
  };

  const onSubmit = async (
    values: CreateProjectFormValues
  ) => {
    try {
      const response = await createMutation.mutateAsync({
        data: {
          name: values.name.trim(),
          description:
            values.description.trim() || null,
        },
      });

      if (response.data?.id) {
        selectProject(response.data.id);
      }

      await queryClient.invalidateQueries({
        queryKey: getGetProjectsQueryKey(),
      });

      toast.success('Project created successfully');
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to create the project.'
        )
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={handleDialogChange}
    >
      <DialogTrigger
        render={
          <Button className="h-9 bg-primary px-4 text-primary-foreground hover:bg-primary-hover" />
        }
      >
        <Plus className="size-4" />
        New project
      </DialogTrigger>

      <DialogContent className="border border-border bg-popover text-foreground ring-0 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create a project</DialogTitle>

          <DialogDescription className="text-muted-foreground">
            Projects contain your environments, feature flags,
            API keys, and team members.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-5 py-3">
            <div className="space-y-2">
              <Label htmlFor="name">Project name</Label>

              <Input
                id="name"
                autoFocus
                placeholder="Developer Portal"
                className="h-10 border-border bg-card"
                {...register('name')}
              />

              {errors.name && (
                <p className="text-xs text-destructive">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Description
                <span className="ml-1 text-muted-foreground">
                  (optional)
                </span>
              </Label>

              <Textarea
                id="description"
                rows={4}
                placeholder="Describe what this project controls..."
                className="resize-none border-border bg-card"
                {...register('description')}
              />

              {errors.description && (
                <p className="text-xs text-destructive">
                  {errors.description.message}
                </p>
              )}
            </div>
          </div>

          <DialogFooter className="border-border bg-card">
            <Button
              type="button"
              variant="outline"
              className="border-border bg-transparent"
              disabled={createMutation.isPending}
              onClick={() => handleDialogChange(false)}
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
              Create project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProjectCard({
  project,
}: {
  project: ProjectSummary;
}) {
  const content = (
    <>
      <div className="flex items-start justify-between">
        <div className="flex size-11 items-center justify-center rounded-xl border border-primary/30 bg-primary-subtle">
          <FolderKanban className="size-5 text-primary" />
        </div>

        <div className="flex items-center gap-2">
          <span
            className={
              project.isActive
                ? 'rounded-full border border-success/30 bg-success-subtle px-2 py-1 text-[10px] font-medium text-success'
                : 'rounded-full border border-border bg-surface-elevated px-2 py-1 text-[10px] font-medium text-muted-foreground'
            }
          >
            {project.isActive ? 'Active' : 'Inactive'}
          </span>

          <ArrowUpRight className="size-4 text-muted-foreground transition-colors group-hover:text-foreground-secondary" />
        </div>
      </div>

      <h2 className="mt-5 truncate text-base font-medium text-foreground">
        {project.name ?? 'Untitled project'}
      </h2>

      <p className="mt-1 font-mono text-xs text-muted-foreground">
        {project.slug ?? 'no-slug'}
      </p>

      <p className="mt-4 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
        {project.description ||
          'No project description has been added.'}
      </p>

      <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ToggleLeft className="size-4" />
          {project.flagCount ?? 0}{' '}
          {(project.flagCount ?? 0) === 1
            ? 'flag'
            : 'flags'}
        </div>

        <span className="text-xs text-muted-foreground">
          {formatProjectDate(project.createdAt)}
        </span>
      </div>
    </>
  );

  if (!project.id) {
    return (
      <article className="rounded-2xl border border-border bg-card p-5">
        {content}
      </article>
    );
  }

  return (
    <Link
      href={`/projects/${project.id}`}
      className="group rounded-2xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-surface-elevated"
    >
      {content}
    </Link>
  );
}

function EmptyProjects({
  onCreate,
}: {
  onCreate: () => void;
}) {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-6 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary-subtle">
        <FolderKanban className="size-6 text-primary" />
      </div>

      <h2 className="mt-5 text-base font-medium text-foreground">
        Create your first project
      </h2>

      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        Projects keep feature flags, environments, API keys,
        and team access organized.
      </p>

      <Button
        className="mt-6 bg-primary text-primary-foreground hover:bg-primary-hover"
        onClick={onCreate}
      >
        <Plus className="size-4" />
        New project
      </Button>
    </div>
  );
}

function NoSearchResults({
  search,
}: {
  search: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card px-6 py-16 text-center">
      <Search className="mx-auto size-6 text-muted-foreground" />
      <p className="mt-4 text-sm text-foreground-secondary">
        No projects match “{search}”
      </p>
    </div>
  );
}

function ProjectsError({
  onRetry,
}: {
  onRetry: () => void;
}) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive-subtle px-6 py-16 text-center">
      <p className="text-sm text-foreground-secondary">
        Unable to load your projects.
      </p>

      <Button
        variant="outline"
        className="mt-5 border-border bg-transparent"
        onClick={onRetry}
      >
        <RefreshCw className="size-4" />
        Try again
      </Button>
    </div>
  );
}

function ProjectsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-64 rounded-2xl bg-surface-elevated"
        />
      ))}
    </div>
  );
}

function formatProjectDate(value?: string): string {
  if (!value) return '';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}
