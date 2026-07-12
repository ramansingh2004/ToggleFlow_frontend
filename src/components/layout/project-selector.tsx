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
            className="flex w-full items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.035] px-3 py-3 text-left outline-none transition-colors hover:bg-white/[0.06] data-popup-open:border-indigo-400/20 data-popup-open:bg-white/[0.06]"
          />
        }
      >
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15">
          {projectsQuery.isPending ? (
            <LoaderCircle className="size-4 animate-spin text-indigo-300" />
          ) : (
            <FolderKanban className="size-4 text-indigo-300" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-zinc-200">
            {selectedProject?.name ??
              'Select a project'}
          </p>

          <p className="truncate font-mono text-[10px] text-zinc-600">
            {selectedProject?.slug ??
              (projects.length === 0
                ? 'No projects yet'
                : 'Choose workspace context')}
          </p>
        </div>

        <ChevronsUpDown className="size-4 shrink-0 text-zinc-600" />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        sideOffset={8}
        className="w-64 border border-white/[0.09] bg-[#0d111a] p-1 text-white shadow-2xl"
      >
        <DropdownMenuGroup>
  <DropdownMenuLabel className="px-2 py-2 text-[10px] uppercase tracking-[0.14em] text-zinc-600">
    Projects
  </DropdownMenuLabel>

  {projects.length === 0 ? (
    <div className="px-2 py-5 text-center text-xs text-zinc-600">
      No projects available
    </div>
  ) : (
    projects.map((project) => (
      <DropdownMenuItem
        key={project.id}
        className="min-h-10 gap-3 px-2 text-zinc-400 focus:bg-white/[0.06] focus:text-white"
        onClick={() =>
          handleProjectSelection(project.id)
        }
      >
        <div className="flex size-7 items-center justify-center rounded-lg bg-white/[0.04]">
          <FolderKanban className="size-3.5 text-indigo-300" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">
            {project.name ?? 'Untitled project'}
          </p>

          <p className="truncate font-mono text-[10px] text-zinc-600">
            {project.slug ?? ''}
          </p>
        </div>

        {project.id === selectedProjectId && (
          <Check className="size-4 text-indigo-300" />
        )}
      </DropdownMenuItem>
    ))
  )}
</DropdownMenuGroup>

<DropdownMenuSeparator className="bg-white/[0.07]" />

<DropdownMenuItem
  className="min-h-9 px-2 text-xs text-zinc-500 focus:bg-indigo-500/10 focus:text-indigo-200"
  onClick={() => router.push('/projects')}
>
  <Plus className="size-4" />
  Create or manage projects
</DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/[0.07]" />

        <DropdownMenuItem
          className="min-h-9 px-2 text-xs text-zinc-500 focus:bg-indigo-500/10 focus:text-indigo-200"
          onClick={() => router.push('/projects')}
        >
          <Plus className="size-4" />
          Create or manage projects
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}