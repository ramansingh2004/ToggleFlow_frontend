'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Braces, LoaderCircle } from 'lucide-react';

import { useGetCurrentUser } from '@/api/generated/authentication/authentication';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();

  const currentUserQuery = useGetCurrentUser({
    query: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  });

  useEffect(() => {
    if (currentUserQuery.isError) {
      router.replace('/login');
    }
  }, [currentUserQuery.isError, router]);

  if (currentUserQuery.isPending) {
    return <DashboardLoader />;
  }

  if (
    currentUserQuery.isError ||
    !currentUserQuery.data?.data
  ) {
    return <DashboardLoader />;
  }

  return <>{children}</>;
}

function DashboardLoader() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-primary/30 bg-primary-subtle">
          <Braces className="size-5 text-primary" />
        </div>

        <LoaderCircle className="mx-auto mt-6 size-5 animate-spin text-primary" />

        <p className="mt-3 text-sm text-muted-foreground">
          Loading your workspace…
        </p>
      </div>
    </main>
  );
}