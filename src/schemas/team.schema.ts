import { z } from 'zod';

export const manageableTeamRoles = [
  'admin',
  'editor',
  'viewer',
] as const;

export const addTeamMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email is required')
    .email('Enter a valid email address'),

  role: z.enum(manageableTeamRoles),
});

export type AddTeamMemberFormValues = z.infer<
  typeof addTeamMemberSchema
>;