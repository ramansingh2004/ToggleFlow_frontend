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
        <p className="text-sm font-medium text-primary">
          Welcome back
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground">
          Sign in to ToggleFlow
        </h1>

        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Continue managing releases, flags, and environments.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className="h-11 border-border bg-card text-foreground hover:border-border hover:bg-surface-elevated hover:text-foreground"
          disabled={oauthLoading !== null}
          onClick={() => handleOAuth('google')}
        >
          {oauthLoading === 'google' ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <span className="flex size-4 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-primary-foreground">
              G
            </span>
          )}
          Google
        </Button>

        <Button
          type="button"
          variant="outline"
          className="h-11 border-border bg-card text-foreground hover:border-border hover:bg-surface-elevated hover:text-foreground"
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
        <div className="h-px flex-1 bg-surface-elevated" />
        <span className="text-xs text-muted-foreground">
          or continue with email
        </span>
        <div className="h-px flex-1 bg-surface-elevated" />
      </div>

      <form
        className="space-y-5"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="space-y-2">
          <Label
            htmlFor="email"
            className="text-sm text-foreground-secondary"
          >
            Email
          </Label>

          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="developer@example.com"
            aria-invalid={Boolean(errors.email)}
            className="h-11 border-border bg-card text-foreground placeholder:text-muted-foreground focus-visible:border-primary/30 focus-visible:ring-ring/40"
            {...register('email')}
          />

          {errors.email && (
            <p className="text-xs text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label
              htmlFor="password"
              className="text-sm text-foreground-secondary"
            >
              Password
            </Label>

            <Link
              href="/forgot-password"
              className="text-xs text-muted-foreground transition-colors hover:text-primary"
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
              className="h-11 border-border bg-card pr-11 text-foreground placeholder:text-muted-foreground focus-visible:border-primary/30 focus-visible:ring-ring/40"
              {...register('password')}
            />

            <button
              type="button"
              aria-label={
                showPassword
                  ? 'Hide password'
                  : 'Show password'
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground-secondary"
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
            <p className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          className="h-11 w-full bg-primary text-primary-foreground hover:bg-primary-hover"
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

      <p className="mt-7 text-center text-sm text-muted-foreground">
        New to ToggleFlow?{' '}
        <Link
          href="/register"
          className="font-medium text-primary transition-colors hover:text-primary"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
