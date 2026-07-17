'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  BarChart3,
  Beaker,
  Bell,
  Braces,
  Boxes,
  CalendarClock,
  FolderKanban,
  KeyRound,
  LayoutDashboard,
  ListFilter,
  LogOut,
  Menu,
  Settings,
  Terminal,
  ToggleLeft,
  Users,
  Webhook,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  getGetCurrentUserQueryKey,
  useGetCurrentUser,
  useLogoutUser,
} from '@/api/generated/authentication/authentication';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/store/ui-store';
import { getApiErrorMessage } from '@/utils/get-api-error-message';
import { ProjectSelector } from '@/components/layout/project-selector';

interface DashboardShellProps {
  children: ReactNode;
}

const navigation = [
  {
    label: 'Overview',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Projects',
    href: '/projects',
    icon: FolderKanban,
  },
  {
    label: 'Feature flags',
    href: '/flags',
    icon: ToggleLeft,
  },
  {
    label: 'Environments',
    href: '/environments',
    icon: Boxes,
  },
  {
    label: 'Experiments',
    href: '/experiments',
    icon: Beaker,
  },
  {
    label: 'Segments',
    href: '/segments',
    icon: ListFilter,
  },
  {
  label: 'Scheduled changes',
  href: '/schedules',
  icon: CalendarClock,
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
];

const managementNavigation = [
  {
    label: 'Team',
    href: '/team',
    icon: Users,
  },
  {
    label: 'Webhooks',
    href: '/webhooks',
    icon: Webhook,
  },
  {
    label: 'SDK quickstart',
    href: '/sdk',
    icon: Terminal,
  },
  {
    label: 'API keys',
    href: '/api-keys',
    icon: KeyRound,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
  },
];

export function DashboardShell({
  children,
}: DashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const {
    isSidebarOpen,
    openSidebar,
    closeSidebar,
  } = useUiStore();

  const currentUserQuery = useGetCurrentUser({
    query: {
      retry: false,
      staleTime: 5 * 60 * 1000,
    },
  });

  const logoutMutation = useLogoutUser();

  const user = currentUserQuery.data?.data;

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();

      queryClient.removeQueries({
        queryKey: getGetCurrentUserQueryKey(),
      });

      toast.success('Signed out successfully');
      router.replace('/login');
      router.refresh();
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Unable to sign out.')
      );
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col border-r border-border bg-surface/95 backdrop-blur-xl transition-transform duration-300 lg:translate-x-0',
          isSidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-5">
          <Link
            href="/dashboard"
            className="flex items-center gap-3"
            onClick={closeSidebar}
          >
            <div className="flex size-9 items-center justify-center rounded-xl border border-primary/30 bg-primary-subtle">
              <Braces className="size-4 text-primary" />
            </div>

            <div>
              <p className="text-sm font-semibold tracking-tight text-foreground">
                ToggleFlow
              </p>
              <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
                Control plane
              </p>
            </div>
          </Link>

          <button
            type="button"
            aria-label="Close sidebar"
            className="text-muted-foreground hover:text-foreground lg:hidden"
            onClick={closeSidebar}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="border-b border-border p-4">
          <ProjectSelector />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <NavigationGroup
            items={navigation}
            pathname={pathname}
            onNavigate={closeSidebar}
          />

          <div className="my-5 h-px bg-surface-elevated" />

          <p className="mb-2 px-3 text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Manage
          </p>

          <NavigationGroup
            items={managementNavigation}
            pathname={pathname}
            onNavigate={closeSidebar}
          />
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary-subtle text-xs font-semibold text-primary">
              {user?.username?.slice(0, 2).toUpperCase() ??
                'TF'}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-foreground">
                {user?.username ?? 'Developer'}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {user?.email ?? ''}
              </p>
            </div>

            <button
              type="button"
              aria-label="Sign out"
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-destructive"
              disabled={logoutMutation.isPending}
              onClick={handleLogout}
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[270px]">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:bg-surface-elevated hover:text-foreground lg:hidden"
              onClick={openSidebar}
            >
              <Menu className="size-5" />
              <span className="sr-only">Open sidebar</span>
            </Button>

            <div>
              <p className="text-xs text-muted-foreground">
                Workspace
              </p>
              <p className="text-sm font-medium text-foreground">
                Personal workspace
              </p>
            </div>
          </div>

          <button
            type="button"
            aria-label="Notifications"
            className="relative rounded-xl border border-border bg-card p-2.5 text-muted-foreground transition-colors hover:bg-surface-elevated hover:text-foreground"
          >
            <Bell className="size-4" />
            <span className="absolute right-2 top-2 size-1.5 rounded-full bg-primary" />
          </button>
        </header>

        <div className="min-h-[calc(100vh-4rem)]">
          {children}
        </div>
      </div>
    </div>
  );
}

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
}

interface NavigationGroupProps {
  items: NavigationItem[];
  pathname: string;
  onNavigate: () => void;
}

function NavigationGroup({
  items,
  pathname,
  onNavigate,
}: NavigationGroupProps) {
  return (
    <div className="space-y-1">
      {items.map((item) => {
        const Icon = item.icon;

        const isActive =
          item.href === '/dashboard'
            ? pathname === item.href
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
              isActive
                ? 'bg-primary-subtle text-primary'
                : 'text-muted-foreground hover:bg-surface-elevated hover:text-foreground'
            )}
            onClick={onNavigate}
          >
            <Icon
              className={cn(
                'size-4',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground group-hover:text-foreground-secondary'
              )}
            />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
