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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#07090f] px-6 text-white">
      <div className="absolute left-1/2 top-1/2 size-[30rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600/15 blur-[130px]" />

      <div className="relative text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-indigo-400/20 bg-indigo-500/10">
          <Braces className="size-6 text-indigo-300" />
        </div>

        <LoaderCircle className="mx-auto mt-8 size-6 animate-spin text-indigo-300" />

        <h1 className="mt-5 text-xl font-semibold">
          Completing authentication
        </h1>

        <p className="mt-2 text-sm text-zinc-500">
          Verifying your ToggleFlow session…
        </p>
      </div>
    </main>
  );
}