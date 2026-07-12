import { z } from 'zod';

export const createApiKeySchema = z.object({
  name: z
    .string()
    .trim()
    .max(100, 'Name cannot exceed 100 characters'),

  expiresAt: z.string(),
});

export type CreateApiKeyFormValues = z.infer<
  typeof createApiKeySchema
>;