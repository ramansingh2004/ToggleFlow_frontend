'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  ChevronsUpDown,
  FolderKanban,
  LoaderCircle,
  Plus,
} from 'lucide-react';

import { useGetProjects } from '@/api/generated/projects/projects';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUiStore } from '@/store/ui-store';

export function ProjectSelector() {
  const router = useRouter();

  const selectedProjectId = useUiStore(
    (state) => state.selectedProjectId
  );

  const selectProject = useUiStore(
    (state) => state.selectProject
  );

  const projectsQuery = useGetProjects({
    query: {
      staleTime: 60 * 1000,
    },
  });

  const projects = useMemo(
    () => projectsQuery.data?.data ?? [],
    [projectsQuery.data?.data]
  );

  const selectedProject = projects.find(
    (project) => project.id === selectedProjectId
  );

  useEffect(() => {
  if (projectsQuery.isPending) return;

  if (projects.length === 0) {
    if (selectedProjectId !== null) {
      selectProject(null);
    }

    return;
  }

  const selectionStillExists = projects.some(
    (project) =>
      project.id === selectedProjectId
  );

  if (selectionStillExists) return;

  const firstProjectId =
    projects.find((project) => project.id)?.id ??
    null;

  if (selectedProjectId !== firstProjectId) {
    selectProject(firstProjectId);
  }
}, [
  projects,
  projectsQuery.isPending,
  selectProject,
  selectedProjectId,
]);

  const handleProjectSelection = (
    projectId?: string
  ) => {
    if (!projectId) return;

    selectProject(projectId);
    router.push(`/projects/${projectId}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-3 text-left outline-none transition-colors hover:bg-surface-elevated data-popup-open:border-primary/30 data-popup-open:bg-surface-elevated"
          />
        }
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-subtle">
          {projectsQuery.isPending ? (
            <LoaderCircle className="size-4 animate-spin text-primary" />
          ) : (
            <FolderKanban className="size-4 text-primary" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-foreground">
            {selectedProject?.name ??
              'Select a project'}
          </p>

          <p className="truncate font-mono text-[10px] text-muted-foreground">
            {selectedProject?.slug ??
              (projects.length === 0
                ? 'No projects yet'
                : 'Choose workspace context')}
          </p>
        </div>

        <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        sideOffset={8}
        className="w-64 border border-border bg-popover p-1 text-foreground shadow-2xl"
      >
        <DropdownMenuGroup>
  <DropdownMenuLabel className="px-2 py-2 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
    Projects
  </DropdownMenuLabel>

  {projects.length === 0 ? (
    <div className="px-2 py-5 text-center text-xs text-muted-foreground">
      No projects available
    </div>
  ) : (
    projects.map((project) => (
      <DropdownMenuItem
        key={project.id}
        className="min-h-10 gap-3 px-2 text-foreground-secondary focus:bg-surface-elevated focus:text-foreground"
        onClick={() =>
          handleProjectSelection(project.id)
        }
      >
        <div className="flex size-7 items-center justify-center rounded-lg bg-surface-elevated">
          <FolderKanban className="size-3.5 text-primary" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">
            {project.name ?? 'Untitled project'}
          </p>

          <p className="truncate font-mono text-[10px] text-muted-foreground">
            {project.slug ?? ''}
          </p>
        </div>

        {project.id === selectedProjectId && (
          <Check className="size-4 text-primary" />
        )}
      </DropdownMenuItem>
    ))
  )}
</DropdownMenuGroup>

<DropdownMenuSeparator className="bg-surface-elevated" />

<DropdownMenuItem
  className="min-h-9 px-2 text-xs text-muted-foreground focus:bg-primary-subtle focus:text-primary"
  onClick={() => router.push('/projects')}
>
  <Plus className="size-4" />
  Create or manage projects
</DropdownMenuItem>

        <DropdownMenuSeparator className="bg-surface-elevated" />

        <DropdownMenuItem
          className="min-h-9 px-2 text-xs text-muted-foreground focus:bg-primary-subtle focus:text-primary"
          onClick={() => router.push('/projects')}
        >
          <Plus className="size-4" />
          Create or manage projects
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}