import { z } from 'zod';

export const webhookEvents = [
  'flag.created',
  'flag.updated',
  'flag.enabled',
  'flag.disabled',
  'flag.deleted',
  'observability.alert.triggered',
  'observability.alert.resolved',
] as const;

export const createWebhookSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Webhook name is required')
    .max(100, 'Name cannot exceed 100 characters'),

  url: z
    .string()
    .trim()
    .url('Enter a valid webhook URL')
    .refine(
      (value) => value.startsWith('https://'),
      'Webhook URL must use HTTPS'
    ),

  events: z
    .array(z.enum(webhookEvents))
    .min(1, 'Select at least one event'),

  active: z.boolean(),
});

export type CreateWebhookFormValues = z.infer<
  typeof createWebhookSchema
>;
