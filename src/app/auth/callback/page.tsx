'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Braces, LoaderCircle } from 'lucide-react';
import { toast } from 'sonner';

import { useGetCurrentUser } from '@/api/generated/authentication/authentication';
import { getApiErrorMessage } from '@/utils/get-api-error-message';

export default function OAuthCallbackPage() {
  const router = useRouter();

  const currentUserQuery = useGetCurrentUser({
    query: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  });

  useEffect(() => {
    if (currentUserQuery.isSuccess) {
      toast.success('Authentication successful');
      router.replace('/dashboard');
      router.refresh();
    }
  }, [
    currentUserQuery.isSuccess,
    router,
  ]);

  useEffect(() => {
    if (currentUserQuery.isError) {
      toast.error(
        getApiErrorMessage(
          currentUserQuery.error,
          'OAuth authentication failed.'
        )
      );

      router.replace('/login');
    }
  }, [
    currentUserQuery.error,
    currentUserQuery.isError,
    router,
  ]);

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-6 text-foreground">
      <div className="absolute left-1/2 top-1/2 size-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary-subtle blur-[130px]" />

      <div className="relative text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-primary/30 bg-primary-subtle">
          <Braces className="size-6 text-primary" />
        </div>

        <LoaderCircle className="mx-auto mt-8 size-6 animate-spin text-primary" />

        <h1 className="mt-5 text-xl font-semibold">
          Completing authentication
        </h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Verifying your ToggleFlow session…
        </p>
      </div>
    </main>
  );
}