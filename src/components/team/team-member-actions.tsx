'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  LoaderCircle,
  Trash2,
} from 'lucide-react';
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
  useRemoveTeamMember,
  useUpdateTeamMemberRole,
} from '@/api/generated/teams/teams';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getApiErrorMessage } from '@/utils/get-api-error-message';

interface TeamMemberActionsProps {
  member: TeamMember;
  projectId: string;
  currentUserRole?: TeamMemberRole;
}

export function TeamMemberActions({
  member,
  projectId,
  currentUserRole,
}: TeamMemberActionsProps) {
  if (
    !member.id ||
    member.role === 'owner' ||
    member.isCurrentUser
  ) {
    return null;
  }

  const ownerCanManage = currentUserRole === 'owner';

  const adminCanManage =
    currentUserRole === 'admin' &&
    (member.role === 'editor' ||
      member.role === 'viewer');

  if (!ownerCanManage && !adminCanManage) {
    return null;
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <RoleSelector
        member={member}
        projectId={projectId}
        currentUserRole={currentUserRole}
      />

      <RemoveMemberDialog
        member={member}
        projectId={projectId}
      />
    </div>
  );
}

function RoleSelector({
  member,
  projectId,
  currentUserRole,
}: TeamMemberActionsProps) {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateTeamMemberRole();

  const roles =
    currentUserRole === 'owner'
      ? (['admin', 'editor', 'viewer'] as const)
      : (['editor', 'viewer'] as const);

  const updateRole = async (
    role: 'admin' | 'editor' | 'viewer'
  ) => {
    if (!member.id || role === member.role) return;

    try {
      await updateMutation.mutateAsync({
        projectId,
        memberId: member.id,
        data: {
          role,
        },
      });

      await invalidateTeamQueries(
        queryClient,
        projectId
      );

      toast.success('Member role updated');
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to update the member role.'
        )
      );
    }
  };

  return (
    <Select
      value={member.role ?? 'viewer'}
      disabled={updateMutation.isPending}
      onValueChange={(value) => {
        if (
          value === 'admin' ||
          value === 'editor' ||
          value === 'viewer'
        ) {
          updateRole(value);
        }
      }}
    >
      <SelectTrigger
        size="sm"
        className="w-28 border-border bg-card capitalize"
      >
        {updateMutation.isPending ? (
          <LoaderCircle className="size-3.5 animate-spin" />
        ) : (
          <SelectValue />
        )}
      </SelectTrigger>

      <SelectContent className="border border-border bg-popover text-foreground">
        {roles.map((role) => (
          <SelectItem
            key={role}
            value={role}
            className="capitalize focus:bg-surface-elevated"
          >
            {role}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function RemoveMemberDialog({
  member,
  projectId,
}: {
  member: TeamMember;
  projectId: string;
}) {
  const [open, setOpen] = useState(false);

  const queryClient = useQueryClient();
  const removeMutation = useRemoveTeamMember();

  const removeMember = async () => {
    if (!member.id) return;

    try {
      await removeMutation.mutateAsync({
        projectId,
        memberId: member.id,
      });

      await invalidateTeamQueries(
        queryClient,
        projectId
      );

      toast.success('Team member removed');
      setOpen(false);
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to remove the team member.'
        )
      );
    }
  };

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && removeMutation.isPending) return;
        setOpen(nextOpen);
      }}
    >
      <AlertDialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
          />
        }
      >
        <Trash2 className="size-4" />
        <span className="sr-only">
          Remove team member
        </span>
      </AlertDialogTrigger>

      <AlertDialogContent className="border border-border bg-popover text-foreground ring-0">
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive-subtle">
            <AlertTriangle className="text-destructive" />
          </AlertDialogMedia>

          <AlertDialogTitle>
            Remove {member.username ?? member.email}?
          </AlertDialogTitle>

          <AlertDialogDescription className="text-muted-foreground">
            This person will immediately lose access to the
            selected project.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter className="border-border bg-card">
          <AlertDialogCancel
            className="border-border bg-transparent"
            disabled={removeMutation.isPending}
          >
            Cancel
          </AlertDialogCancel>

          <AlertDialogAction
            variant="destructive"
            disabled={removeMutation.isPending}
            onClick={removeMember}
          >
            {removeMutation.isPending && (
              <LoaderCircle className="size-4 animate-spin" />
            )}
            Remove member
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

async function invalidateTeamQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  projectId: string
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: getGetTeamMembersQueryKey(projectId),
    }),
    queryClient.invalidateQueries({
      queryKey: getGetTeamStatsQueryKey(projectId),
    }),
    queryClient.invalidateQueries({
      queryKey: getGetProjectByIdQueryKey(projectId),
    }),
    queryClient.invalidateQueries({
      queryKey: getGetDashboardStatsQueryKey(),
    }),
  ]);
}