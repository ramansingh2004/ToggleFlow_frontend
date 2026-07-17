'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import {
  Braces,
  KeyRound,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import {
  getGetCurrentUserQueryKey,
  useChangePassword,
  useGetCurrentUser,
  useGetLinkedOAuthProviders,
  useUpdateUserProfile,
} from '@/api/generated/authentication/authentication';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  passwordSettingsSchema,
  profileSettingsSchema,
  type PasswordSettingsValues,
  type ProfileSettingsValues,
} from '@/schemas/settings.schema';
import { getApiErrorMessage } from '@/utils/get-api-error-message';
import type { User } from '@/api/generated/models';

export function SettingsPage() {
  const currentUserQuery = useGetCurrentUser({
    query: {
      staleTime: 5 * 60 * 1000,
    },
  });

  const providersQuery = useGetLinkedOAuthProviders({
    query: {
      staleTime: 5 * 60 * 1000,
    },
  });

  if (currentUserQuery.isPending) {
    return <SettingsSkeleton />;
  }

  if (
    currentUserQuery.isError ||
    !currentUserQuery.data?.data
  ) {
    return (
      <main className="p-6">
        <div className="mx-auto max-w-5xl rounded-2xl border border-destructive/30 bg-destructive-subtle py-16 text-center text-sm text-muted-foreground">
          Unable to load account settings.
        </div>
      </main>
    );
  }

  const user = currentUserQuery.data.data;
  const providers = providersQuery.data?.data;

  return (
    <main className="p-5 sm:p-7 lg:p-8">
      <div className="mx-auto max-w-5xl">
        <div>
          <p className="text-sm font-medium text-primary">
            Account
          </p>

          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground">
            Settings
          </h1>

          <p className="mt-3 text-sm text-muted-foreground">
            Manage your ToggleFlow profile and account
            security.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <ProfileSettings
            user={user}
          />

          <SignInMethod
            primaryAuth={providers?.primaryAuth}
            linkedProviders={
              providers?.linkedProviders ?? []
            }
            email={providers?.email ?? user.email}
            loading={providersQuery.isPending}
          />

          {providers?.primaryAuth !== 'oauth' && (
            <PasswordSettings />
          )}

          {providers?.primaryAuth === 'oauth' && (
            <OAuthPasswordNotice />
          )}
        </div>
      </div>
    </main>
  );
}

function ProfileSettings({
  user,
}: {
  user: User;
}) {
  const queryClient = useQueryClient();
  const updateMutation = useUpdateUserProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileSettingsValues>({
    resolver: zodResolver(profileSettingsSchema),
    defaultValues: {
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      avatar: user?.avatar ?? '',
    },
  });

  useEffect(() => {
    reset({
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      avatar: user?.avatar ?? '',
    });
  }, [
    reset,
    user?.avatar,
    user?.firstName,
    user?.lastName,
  ]);

  const saveProfile = async (
    values: ProfileSettingsValues
  ) => {
    try {
      await updateMutation.mutateAsync({
        data: {
          firstName: values.firstName.trim(),
          lastName: values.lastName.trim(),
          ...(values.avatar.trim()
            ? { avatar: values.avatar.trim() }
            : {}),
        },
      });

      await queryClient.invalidateQueries({
        queryKey: getGetCurrentUserQueryKey(),
      });

      toast.success('Profile updated');
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to update your profile.'
        )
      );
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <SectionHeader
        icon={UserRound}
        title="Profile"
        description="Information displayed in your workspace."
      />

      <form
        onSubmit={handleSubmit(saveProfile)}
        noValidate
      >
        <div className="space-y-5 p-5 sm:p-6">
          <div className="flex items-center gap-4 rounded-xl border border-border bg-background p-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary-subtle text-sm font-semibold text-primary">
              {getInitials(
                user?.firstName,
                user?.lastName,
                user?.username
              )}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {user?.username ?? 'Developer'}
              </p>

              <p className="mt-1 truncate text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="First name"
              error={errors.firstName?.message}
            >
              <Input
                placeholder="First name"
                className="border-border bg-card"
                {...register('firstName')}
              />
            </FormField>

            <FormField
              label="Last name"
              error={errors.lastName?.message}
            >
              <Input
                placeholder="Last name"
                className="border-border bg-card"
                {...register('lastName')}
              />
            </FormField>
          </div>

          <FormField
            label="Avatar URL"
            error={errors.avatar?.message}
          >
            <Input
              type="url"
              placeholder="https://example.com/avatar.png"
              className="border-border bg-card"
              {...register('avatar')}
            />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <ReadOnlyField
              label="Email"
              value={user?.email ?? ''}
            />

            <ReadOnlyField
              label="Username"
              value={user?.username ?? ''}
            />
          </div>
        </div>

        <div className="flex justify-end border-t border-border bg-card px-5 py-4 sm:px-6">
          <Button
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-primary-hover"
            disabled={
              updateMutation.isPending || !isDirty
            }
          >
            {updateMutation.isPending && (
              <LoaderCircle className="size-4 animate-spin" />
            )}
            Save profile
          </Button>
        </div>
      </form>
    </section>
  );
}

function SignInMethod({
  primaryAuth,
  linkedProviders,
  email,
  loading,
}: {
  primaryAuth?: string;
  linkedProviders: string[];
  email?: string;
  loading: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <SectionHeader
        icon={ShieldCheck}
        title="Sign-in method"
        description="The authentication method protecting your account."
      />

      <div className="p-5 sm:p-6">
        {loading ? (
          <Skeleton className="h-20 rounded-xl bg-surface-elevated" />
        ) : (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary-subtle">
                {primaryAuth === 'oauth' ? (
                  <Braces className="size-4 text-primary" />
                ) : (
                  <KeyRound className="size-4 text-primary" />
                )}
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium capitalize text-foreground">
                  {primaryAuth === 'oauth'
                    ? linkedProviders[0] ??
                      'OAuth'
                    : 'Email and password'}
                </p>

                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {email}
                </p>
              </div>
            </div>

            <span className="rounded-full border border-success/30 bg-success-subtle px-2.5 py-1 text-[10px] text-success">
              Active
            </span>
          </div>
        )}

        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Provider linking and unlinking will be available
          after multi-provider account protection is added.
        </p>
      </div>
    </section>
  );
}

function PasswordSettings() {
  const changeMutation = useChangePassword();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordSettingsValues>({
    resolver: zodResolver(passwordSettingsSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const changePassword = async (
    values: PasswordSettingsValues
  ) => {
    try {
      await changeMutation.mutateAsync({
        data: {
          oldPassword: values.oldPassword,
          newPassword: values.newPassword,
        },
      });

      reset();
      toast.success('Password changed successfully');
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to change your password.'
        )
      );
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <SectionHeader
        icon={LockKeyhole}
        title="Password"
        description="Choose a strong password unique to ToggleFlow."
      />

      <form
        onSubmit={handleSubmit(changePassword)}
        noValidate
      >
        <div className="space-y-5 p-5 sm:p-6">
          <FormField
            label="Current password"
            error={errors.oldPassword?.message}
          >
            <Input
              type="password"
              autoComplete="current-password"
              className="border-border bg-card"
              {...register('oldPassword')}
            />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              label="New password"
              error={errors.newPassword?.message}
            >
              <Input
                type="password"
                autoComplete="new-password"
                className="border-border bg-card"
                {...register('newPassword')}
              />
            </FormField>

            <FormField
              label="Confirm password"
              error={errors.confirmPassword?.message}
            >
              <Input
                type="password"
                autoComplete="new-password"
                className="border-border bg-card"
                {...register('confirmPassword')}
              />
            </FormField>
          </div>

          <p className="text-xs leading-5 text-muted-foreground">
            Use at least eight characters with uppercase,
            lowercase, a number, and one of @$!%*?&.
          </p>
        </div>

        <div className="flex justify-end border-t border-border bg-card px-5 py-4 sm:px-6">
          <Button
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-primary-hover"
            disabled={changeMutation.isPending}
          >
            {changeMutation.isPending && (
              <LoaderCircle className="size-4 animate-spin" />
            )}
            Change password
          </Button>
        </div>
      </form>
    </section>
  );
}

function OAuthPasswordNotice() {
  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <div className="flex gap-3">
        <LockKeyhole className="mt-0.5 size-4 shrink-0 text-muted-foreground" />

        <div>
          <p className="text-sm text-foreground-secondary">
            Password management unavailable
          </p>

          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            This account signs in through an OAuth provider.
            Password changes are not available for this account
            type.
          </p>
        </div>
      </div>
    </section>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{
    className?: string;
  }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-border px-5 py-4 sm:px-6">
      <Icon className="mt-0.5 size-4 text-primary" />

      <div>
        <h2 className="text-sm font-medium text-foreground">
          {title}
        </h2>

        <p className="mt-1 text-xs text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}

function FormField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  );
}

function ReadOnlyField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      <Input
        value={value}
        readOnly
        className="border-border bg-background text-muted-foreground"
      />
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <main className="p-5 sm:p-7 lg:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-24 rounded-2xl bg-surface-elevated" />
        <Skeleton className="h-96 rounded-2xl bg-surface-elevated" />
        <Skeleton className="h-40 rounded-2xl bg-surface-elevated" />
        <Skeleton className="h-80 rounded-2xl bg-surface-elevated" />
      </div>
    </main>
  );
}

function getInitials(
  firstName?: string | null,
  lastName?: string | null,
  username?: string
): string {
  const initials = `${firstName?.[0] ?? ''}${
    lastName?.[0] ?? ''
  }`;

  return (
    initials ||
    username?.slice(0, 2) ||
    'TF'
  ).toUpperCase();
}