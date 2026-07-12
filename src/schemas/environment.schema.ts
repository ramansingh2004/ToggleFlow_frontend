import { z } from 'zod';

export const environmentTypes = [
  'development',
  'staging',
  'production',
] as const;

export const createEnvironmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Environment name is required')
    .max(100, 'Name cannot exceed 100 characters'),

  type: z.enum(environmentTypes),

  description: z
    .string()
    .trim()
    .max(500, 'Description cannot exceed 500 characters'),
});

export type EnvironmentFormValues = z.infer<
  typeof createEnvironmentSchema
>;