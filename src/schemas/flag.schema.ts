import { z } from 'zod';

export const createFlagSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Flag name is required')
    .max(100, 'Flag name cannot exceed 100 characters'),

  key: z
    .string()
    .trim()
    .min(1, 'Flag key is required')
    .max(50, 'Flag key cannot exceed 50 characters')
    .regex(
      /^[a-z0-9_]+$/,
      'Use lowercase letters, numbers, and underscores only'
    ),

  description: z
    .string()
    .trim()
    .max(500, 'Description cannot exceed 500 characters'),
});

export type CreateFlagFormValues = z.infer<
  typeof createFlagSchema
>;