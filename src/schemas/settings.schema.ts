import { z } from 'zod';

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const profileSettingsSchema = z.object({
  firstName: z
    .string()
    .trim()
    .max(50, 'First name must be at most 50 characters.'),

  lastName: z
    .string()
    .trim()
    .max(50, 'Last name must be at most 50 characters.'),

  avatar: z
    .string()
    .trim()
    .refine(
      (value) => {
        if (!value) return true;

        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      {
        message: 'Enter a valid avatar URL.',
      }
    ),
});

export const passwordSettingsSchema = z
  .object({
    oldPassword: z
      .string()
      .min(1, 'Current password is required.'),

    newPassword: z
      .string()
      .min(
        8,
        'New password must be at least 8 characters.'
      )
      .regex(
        passwordRegex,
        'Use uppercase, lowercase, a number, and a special character.'
      ),

    confirmPassword: z
      .string()
      .min(1, 'Confirm your new password.'),
  })
  .refine(
    (values) =>
      values.newPassword === values.confirmPassword,
    {
      path: ['confirmPassword'],
      message: 'Passwords do not match.',
    }
  );

export type ProfileSettingsValues = z.infer<
  typeof profileSettingsSchema
>;

export type PasswordSettingsValues = z.infer<
  typeof passwordSettingsSchema
>;