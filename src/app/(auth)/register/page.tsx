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
  useRegisterUser,
} from '@/api/generated/authentication/authentication';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  registerSchema,
  type RegisterFormValues,
} from '@/schemas/auth.schema';
import { getApiErrorMessage } from '@/utils/get-api-error-message';

type OAuthProvider = 'google' | 'github';

export default function RegisterPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] =
    useState(false);
  const [oauthLoading, setOAuthLoading] =
    useState<OAuthProvider | null>(null);

  const registerMutation = useRegisterUser();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      username: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    const { confirmPassword: _, ...registrationData } =
      values;

    try {
      await registerMutation.mutateAsync({
        data: registrationData,
      });

      toast.success('Your ToggleFlow account is ready');

      router.replace('/dashboard');
      router.refresh();
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to create your account.'
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
      <div className="mb-7">
        <p className="text-sm font-medium text-indigo-300">
          Start shipping safely
        </p>

        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">
          Create your account
        </h1>

        <p className="mt-3 text-sm leading-6 text-zinc-500">
          Set up your ToggleFlow workspace in a few seconds.
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

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-white/[0.08]" />
        <span className="text-xs text-zinc-600">
          or register with email
        </span>
        <div className="h-px flex-1 bg-white/[0.08]" />
      </div>

      <form
        className="space-y-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="developer@example.com"
          error={errors.email?.message}
          registration={register('email')}
        />

        <FormField
          id="username"
          label="Username"
          autoComplete="username"
          placeholder="raman_dev"
          error={errors.username?.message}
          registration={register('username')}
        />

        <PasswordField
          id="password"
          label="Password"
          autoComplete="new-password"
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          error={errors.password?.message}
          registration={register('password')}
        />

        <PasswordField
          id="confirmPassword"
          label="Confirm password"
          autoComplete="new-password"
          showPassword={showConfirmation}
          setShowPassword={setShowConfirmation}
          error={errors.confirmPassword?.message}
          registration={register('confirmPassword')}
        />

        <p className="text-xs leading-5 text-zinc-600">
          Use at least 8 characters with uppercase,
          lowercase, number, and special character.
        </p>

        <Button
          type="submit"
          className="h-11 w-full bg-indigo-500 text-white shadow-[0_0_30px_rgba(99,102,241,0.2)] hover:bg-indigo-400"
          disabled={
            registerMutation.isPending ||
            oauthLoading !== null
          }
        >
          {registerMutation.isPending && (
            <LoaderCircle className="size-4 animate-spin" />
          )}
          Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-zinc-500">
        Already have an account?{' '}
        <Link
          href="/login"
          className="font-medium text-indigo-300 transition-colors hover:text-indigo-200"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

interface FormFieldProps {
  id: string;
  label: string;
  type?: string;
  autoComplete?: string;
  placeholder: string;
  error?: string;
  registration: React.InputHTMLAttributes<HTMLInputElement>;
}

function FormField({
  id,
  label,
  type = 'text',
  autoComplete,
  placeholder,
  error,
  registration,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="text-sm text-zinc-300"
      >
        {label}
      </Label>

      <Input
        id={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className="h-11 border-white/10 bg-white/[0.035] text-white placeholder:text-zinc-700 focus-visible:border-indigo-400/50 focus-visible:ring-indigo-400/20"
        {...registration}
      />

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

interface PasswordFieldProps {
  id: string;
  label: string;
  autoComplete: string;
  showPassword: boolean;
  setShowPassword: (
    updater: (current: boolean) => boolean
  ) => void;
  error?: string;
  registration: React.InputHTMLAttributes<HTMLInputElement>;
}

function PasswordField({
  id,
  label,
  autoComplete,
  showPassword,
  setShowPassword,
  error,
  registration,
}: PasswordFieldProps) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={id}
        className="text-sm text-zinc-300"
      >
        {label}
      </Label>

      <div className="relative">
        <Input
          id={id}
          type={showPassword ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder="Enter your password"
          aria-invalid={Boolean(error)}
          className="h-11 border-white/10 bg-white/[0.035] pr-11 text-white placeholder:text-zinc-700 focus-visible:border-indigo-400/50 focus-visible:ring-indigo-400/20"
          {...registration}
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

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}