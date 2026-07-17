'use client';

import { useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  Crown,
  FolderKanban,
  LoaderCircle,
  Plus,
  Shield,
  UserRound,
  Users,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { getGetDashboardStatsQueryKey } from '@/api/generated/dashboard/dashboard';
import type {
  TeamMember,
  TeamMemberRole,
} from '@/api/generated/models';
import { getGetProjectByIdQueryKey } from '@/api/generated/projects/projects';
import {
  getGetTeamMembersQueryKey,
  getGetTeamStatsQueryKey,
  useAddTeamMember,
  useGetTeamMembers,
  useGetTeamStats,
} from '@/api/generated/teams/teams';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  addTeamMemberSchema,
  manageableTeamRoles,
  type AddTeamMemberFormValues,
} from '@/schemas/team.schema';
import { useUiStore } from '@/store/ui-store';
import { getApiErrorMessage } from '@/utils/get-api-error-message';
import { TeamMemberActions } from '@/components/team/team-member-actions';

export function TeamPage() {
  const selectedProjectId = useUiStore(
    (state) => state.selectedProjectId
  );

  const [addMemberOpen, setAddMemberOpen] =
    useState(false);

  const teamQuery = useGetTeamMembers(
    selectedProjectId ?? '',
    {
      query: {
        enabled: Boolean(selectedProjectId),
        staleTime: 30 * 1000,
      },
    }
  );

  const statsQuery = useGetTeamStats(
    selectedProjectId ?? '',
    {
      query: {
        enabled: Boolean(selectedProjectId),
        staleTime: 30 * 1000,
      },
    }
  );

  const members = teamQuery.data?.data ?? [];
  const stats = statsQuery.data?.data;

  const currentMember = members.find(
    (member) => member.isCurrentUser
  );

  const canManage =
    currentMember?.role === 'owner' ||
    currentMember?.role === 'admin';

  if (!selectedProjectId) {
    return <NoProjectSelected />;
  }

  return (
    <main className="p-5 sm:p-7 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-medium text-primary">
              Collaboration
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground">
              Team
            </h1>

            <p className="mt-3 text-sm text-muted-foreground">
              Control who can view and manage this project.
            </p>
          </div>

          {canManage && (
            <AddTeamMemberDialog
              projectId={selectedProjectId}
              open={addMemberOpen}
              onOpenChange={setAddMemberOpen}
            />
          )}
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <TeamMetric
            label="Total members"
            value={stats?.total ?? members.length}
            icon={Users}
          />

          <TeamMetric
            label="Administrators"
            value={
              (stats?.owner ?? 0) +
              (stats?.admin ?? 0)
            }
            icon={Shield}
          />

          <TeamMetric
            label="Editors"
            value={stats?.editor ?? 0}
            icon={UserRound}
          />

          <TeamMetric
            label="Viewers"
            value={stats?.viewer ?? 0}
            icon={UserRound}
          />
        </section>

        <section className="mt-6 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-medium text-foreground">
              Project members
            </h2>

            <p className="mt-1 text-xs text-muted-foreground">
              Roles determine access across the selected
              project.
            </p>
          </div>

          {teamQuery.isPending ? (
            <TeamSkeleton />
          ) : teamQuery.isError ? (
            <div className="py-20 text-center text-sm text-muted-foreground">
              Unable to load team members.
            </div>
          ) : members.length === 0 ? (
            <EmptyTeam
              canManage={canManage}
              onAdd={() => setAddMemberOpen(true)}
            />
          ) : (
            <div className="divide-y divide-border">
              {members.map((member, index) => (
                <TeamMemberRow
                  key={member.id ?? index}
                  member={member}
                  projectId={selectedProjectId}
                  currentUserRole={currentMember?.role}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function TeamMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{
    className?: string;
  }>;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex size-9 items-center justify-center rounded-xl border border-primary/30 bg-primary-subtle">
        <Icon className="size-4 text-primary" />
      </div>

      <p className="mt-5 text-2xl font-semibold text-foreground">
        {value}
      </p>

      <p className="mt-1 text-xs text-muted-foreground">
        {label}
      </p>
    </div>
  );
}

function TeamMemberRow({
  member,
  projectId,
  currentUserRole,
}: {
  member: TeamMember;
  projectId: string;
  currentUserRole?: TeamMemberRole;
}) {
  return (
    <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary-subtle text-xs font-semibold text-primary">
          {getInitials(member)}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-medium text-foreground">
              {member.username ?? 'Developer'}
            </p>

            {member.isCurrentUser && (
              <span className="rounded-full bg-surface-elevated px-2 py-0.5 text-[9px] text-muted-foreground">
                You
              </span>
            )}
          </div>

          <p className="mt-1 truncate text-xs text-muted-foreground">
            {member.email ?? ''}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 sm:justify-end">
        <RoleBadge role={member.role} />

        <p className="text-xs text-muted-foreground">
           Joined {formatDate(member.joinedAt)}
        </p>

        <TeamMemberActions
          member={member}
          projectId={projectId}
          currentUserRole={currentUserRole}
        />
      </div>
    </div>
  );
}

function RoleBadge({
  role = 'viewer',
}: {
  role?: TeamMemberRole;
}) {
  const styles = {
    owner:
      'border-warning/30 bg-warning-subtle text-warning',
    admin:
      'border-border bg-surface-elevated text-foreground-secondary',
    editor:
      'border-border bg-surface-elevated text-foreground-secondary',
    viewer:
      'border-border bg-card text-muted-foreground',
  };

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] capitalize ${styles[role]}`}
    >
      {role === 'owner' && (
        <Crown className="size-3" />
      )}
      {role}
    </span>
  );
}

interface AddTeamMemberDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function AddTeamMemberDialog({
  projectId,
  open,
  onOpenChange,
}: AddTeamMemberDialogProps) {
  const queryClient = useQueryClient();
  const addMutation = useAddTeamMember();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<AddTeamMemberFormValues>({
    resolver: zodResolver(addTeamMemberSchema),
    defaultValues: {
      email: '',
      role: 'viewer',
    },
  });

  const role = watch('role');

  const onSubmit = async (
    values: AddTeamMemberFormValues
  ) => {
    try {
      await addMutation.mutateAsync({
        projectId,
        data: values,
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey:
            getGetTeamMembersQueryKey(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey:
            getGetTeamStatsQueryKey(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey:
            getGetProjectByIdQueryKey(projectId),
        }),
        queryClient.invalidateQueries({
          queryKey: getGetDashboardStatsQueryKey(),
        }),
      ]);

      toast.success('Team member added');
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to add the team member.'
        )
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && addMutation.isPending) return;

        onOpenChange(nextOpen);

        if (!nextOpen) reset();
      }}
    >
      <DialogTrigger
        render={
          <Button className="h-9 bg-primary px-4 text-primary-foreground hover:bg-primary-hover" />
        }
      >
        <Plus className="size-4" />
        Add member
      </DialogTrigger>

      <DialogContent className="border border-border bg-popover text-foreground ring-0 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add team member</DialogTitle>

          <DialogDescription className="text-muted-foreground">
            The user must already have a ToggleFlow account.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <div className="space-y-5 py-3">
            <div className="space-y-2">
              <Label htmlFor="member-email">
                Email
              </Label>

              <Input
                id="member-email"
                type="email"
                placeholder="developer@example.com"
                className="border-border bg-card"
                {...register('email')}
              />

              {errors.email && (
                <p className="text-xs text-destructive">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Role</Label>

              <Select
                value={role}
                onValueChange={(value) => {
                  if (
                    value &&
                    manageableTeamRoles.includes(
                      value as AddTeamMemberFormValues['role']
                    )
                  ) {
                    setValue(
                      'role',
                      value as AddTeamMemberFormValues['role'],
                      { shouldValidate: true }
                    );
                  }
                }}
              >
                <SelectTrigger className="h-10 w-full border-border bg-card">
                  <SelectValue />
                </SelectTrigger>

                <SelectContent className="border border-border bg-popover text-foreground">
                  {manageableTeamRoles.map(
                    (teamRole) => (
                      <SelectItem
                        key={teamRole}
                        value={teamRole}
                        className="capitalize focus:bg-surface-elevated"
                      >
                        {teamRole}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="border-border bg-card">
            <Button
              type="button"
              variant="outline"
              className="border-border bg-transparent"
              disabled={addMutation.isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary-hover"
              disabled={addMutation.isPending}
            >
              {addMutation.isPending && (
                <LoaderCircle className="size-4 animate-spin" />
              )}
              Add member
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function EmptyTeam({
  canManage,
  onAdd,
}: {
  canManage: boolean;
  onAdd: () => void;
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
      <Users className="size-8 text-primary" />

      <p className="mt-4 text-sm font-medium text-foreground-secondary">
        No team members found
      </p>

      {canManage && (
        <Button
          className="mt-5 bg-primary text-primary-foreground"
          onClick={onAdd}
        >
          <Plus className="size-4" />
          Add member
        </Button>
      )}
    </div>
  );
}

function NoProjectSelected() {
  return (
    <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-6">
      <div className="text-center">
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

function TeamSkeleton() {
  return (
    <div className="space-y-1 p-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton
          key={index}
          className="h-20 bg-surface-elevated"
        />
      ))}
    </div>
  );
}

function getInitials(member: TeamMember): string {
  const source =
    member.username ?? member.email ?? 'TF';

  return source.slice(0, 2).toUpperCase();
}

function formatDate(value?: string): string {
  if (!value) return 'Unknown';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}