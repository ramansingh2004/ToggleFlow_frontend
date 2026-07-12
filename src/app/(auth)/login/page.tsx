'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Eye,
  EyeOff,
  GitBranch,
  LoaderCircle,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  getGitHubAuthorizationUrl,
  getGoogleAuthorizationUrl,
  useLoginUser,
} from '@/api/generated/authentication/authentication';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  loginSchema,
  type LoginFormValues,
} from '@/schemas/auth.schema';
import { getApiErrorMessage } from '@/utils/get-api-error-message';

type OAuthProvider = 'google' | 'github';

export default function LoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [oauthLoading, setOAuthLoading] =
    useState<OAuthProvider | null>(null);

  const loginMutation = useLoginUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      await loginMutation.mutateAsync({
        data: values,
      });

      toast.success('Welcome back');

      router.replace('/dashboard');
      router.refresh();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to sign in with those credentials.'
        )
      );
    }
  };

  const handleOAuth = async (
    provider: OAuthProvider
  ) => {
    try {
      setOAuthLoading(provider);

      const response =
        provider === 'google'
          ? await getGoogleAuthorizationUrl()
          : await getGitHubAuthorizationUrl();

      const authorizationUrl = response.data?.url;

      if (!authorizationUrl) {
        throw new Error(
          `${provider} authentication is unavailable.`
        );
      }

      window.location.assign(authorizationUrl);
    } catch (error) {
      setOAuthLoading(null);

      toast.error(
        getApiErrorMessage(
          error,
          `Unable to continue with ${provider}.`
        )
      );
    }
  };

  return (
    <div>
      <div className="mb-8">
        <p className="text-sm font-medium text-indigo-300">
          Welcome back
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">
          Sign in to ToggleFlow
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-500">
          Continue managing releases, flags, and environments.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-11 border-white/10 bg-white/[0.03] text-zinc-200 hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
          disabled={oauthLoading !== null}
          onClick={() => handleOAuth('google')}
        >
          {oauthLoading === 'google' ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <span className="flex size-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-blue-600">
              G
            </span>
          )}
          Google
        </Button>

        <Button
          type="button"
          variant="outline"
          className="h-11 border-white/10 bg-white/[0.03] text-zinc-200 hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
          disabled={oauthLoading !== null}
          onClick={() => handleOAuth('github')}
        >
          {oauthLoading === 'github' ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <GitBranch className="size-4" />
          )}
          GitHub
        </Button>
      </div>

      <div className="my-7 flex items-center gap-4">
        <div className="h-px flex-1 bg-white/[0.08]" />
        <span className="text-xs text-zinc-600">
          or continue with email
        </span>
        <div className="h-px flex-1 bg-white/[0.08]" />
      </div>

      <form
        className="space-y-5"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="text-sm text-zinc-300"
          >
            Email
          </Label>

          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="developer@example.com"
            aria-invalid={Boolean(errors.email)}
            className="h-11 border-white/10 bg-white/[0.035] text-white placeholder:text-zinc-700 focus-visible:border-indigo-400/50 focus-visible:ring-indigo-400/20"
            {...register('email')}
          />

          {errors.email && (
            <p className="text-xs text-red-400">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="password"
              className="text-sm text-zinc-300"
            >
              Password
            </Label>

            <Link
              href="/forgot-password"
              className="text-xs text-zinc-500 transition-colors hover:text-indigo-300"
            >
              Forgot password?
            </Link>
          </div>

          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="Enter your password"
              aria-invalid={Boolean(errors.password)}
              className="h-11 border-white/10 bg-white/[0.035] pr-11 text-white placeholder:text-zinc-700 focus-visible:border-indigo-400/50 focus-visible:ring-indigo-400/20"
              {...register('password')}
            />

            <button
              type="button"
              aria-label={
                showPassword
                  ? 'Hide password'
                  : 'Show password'
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 transition-colors hover:text-zinc-300"
              onClick={() =>
                setShowPassword((current) => !current)
              }
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>

          {errors.password && (
            <p className="text-xs text-red-400">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="h-11 w-full bg-indigo-500 text-white shadow-[0_0_30px_rgba(99,102,241,0.2)] hover:bg-indigo-400"
          disabled={
            loginMutation.isPending || oauthLoading !== null
          }
        >
          {loginMutation.isPending && (
            <LoaderCircle className="size-4 animate-spin" />
          )}
          Sign in
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-zinc-500">
        New to ToggleFlow?{' '}
        <Link
          href="/register"
          className="font-medium text-indigo-300 transition-colors hover:text-indigo-200"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}