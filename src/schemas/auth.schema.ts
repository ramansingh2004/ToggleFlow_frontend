import { z } from 'zod';

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),

  password: z
    .string()
    .min(1, 'Password is required'),
});

export const registerSchema = z
  .object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Enter a valid email address'),

    username: z
      .string()
      .min(3, 'Username must contain at least 3 characters')
      .max(30, 'Username must contain at most 30 characters')
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        'Use only letters, numbers, underscores, and hyphens'
      ),

    password: z
      .string()
      .min(8, 'Password must contain at least 8 characters')
      .regex(
        passwordRegex,
        'Include uppercase, lowercase, number, and special character'
      ),

    confirmPassword: z
      .string()
      .min(1, 'Confirm your password'),
  })
  .refine(
    (values) => values.password === values.confirmPassword,
    {
      path: ['confirmPassword'],
      message: 'Passwords do not match',
    }
  );

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<
  typeof registerSchema
>;