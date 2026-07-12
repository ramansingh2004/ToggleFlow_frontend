import { z } from 'zod';

const experimentVariantSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Variant name is required.')
    .max(100, 'Variant name must be at most 100 characters.'),

  weight: z
    .number({
      error: 'Weight is required.',
    })
    .int('Weight must be a whole number.')
    .min(0, 'Weight cannot be negative.')
    .max(100, 'Weight cannot exceed 100.'),
});

export const createExperimentSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Experiment name is required.')
      .max(100),

    description: z
      .string()
      .trim()
      .max(500)
      .optional(),

    flagId: z
      .string()
      .min(1, 'Select a feature flag.'),

    conversionMetric: z
      .string()
      .trim()
      .min(1, 'Conversion metric is required.')
      .max(100),

    variants: z
      .array(experimentVariantSchema)
      .min(2, 'At least two variants are required.'),
  })
  .superRefine((values, context) => {
    const totalWeight = values.variants.reduce(
      (total, variant) => total + variant.weight,
      0
    );

    if (totalWeight !== 100) {
      context.addIssue({
        code: 'custom',
        path: ['variants'],
        message: `Variant weights must total 100%. Current total: ${totalWeight}%.`,
      });
    }

    const normalizedNames = values.variants.map((variant) =>
      variant.name.trim().toLowerCase()
    );

    if (new Set(normalizedNames).size !== normalizedNames.length) {
      context.addIssue({
        code: 'custom',
        path: ['variants'],
        message: 'Variant names must be unique.',
      });
    }
  });

export type CreateExperimentFormValues = z.infer<
  typeof createExperimentSchema
>;