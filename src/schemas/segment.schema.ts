import { z } from 'zod';

export const segmentRuleTypes = [
  'email',
  'country',
  'custom',
] as const;

export const segmentRuleOperators = [
  'equals',
  'contains',
  'in',
  'startsWith',
] as const;

const segmentRuleFormSchema = z
  .object({
    type: z.enum(segmentRuleTypes),

    attribute: z
      .string()
      .trim()
      .max(100)
      .optional(),

    operator: z.enum(segmentRuleOperators),

    value: z
      .string()
      .trim()
      .min(1, 'A comparison value is required.'),
  })
  .superRefine((rule, context) => {
    if (
      rule.type === 'custom' &&
      !rule.attribute?.trim()
    ) {
      context.addIssue({
        code: 'custom',
        path: ['attribute'],
        message:
          'Enter the custom user attribute name.',
      });
    }

    if (rule.operator === 'in') {
      const values = rule.value
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

      if (values.length === 0) {
        context.addIssue({
          code: 'custom',
          path: ['value'],
          message:
            'Enter at least one comma-separated value.',
        });
      }
    }
  });

export const createSegmentFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Segment name is required.')
    .max(100),

  description: z
    .string()
    .trim()
    .max(500)
    .optional(),

  rules: z
    .array(segmentRuleFormSchema)
    .min(1, 'Add at least one rule.'),
});

export type SegmentFormValues = z.infer<
  typeof createSegmentFormSchema
>;