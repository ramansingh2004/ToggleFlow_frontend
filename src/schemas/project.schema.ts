import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Project name is required')
    .max(100, 'Project name cannot exceed 100 characters'),

  description: z
    .string()
    .trim()
    .max(500, 'Description cannot exceed 500 characters'),
});

export type CreateProjectFormValues = z.infer<
  typeof createProjectSchema
>;