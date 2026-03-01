import { z } from 'zod';

export function createReportSchema(t: (key: string) => string) {
  return z
    .object({
      title: z
        .string()
        .min(1, { message: t('validation.titleRequired') })
        .min(5, { message: t('validation.titleMinLength') }),
      description: z
        .string()
        .min(1, { message: t('validation.descriptionRequired') })
        .min(15, { message: t('validation.descriptionMinLength') }),
      cep: z.string().optional(),
      street: z.string().optional(),
      number: z.string().optional(),
      complement: z.string().optional(),
      neighborhood: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      reference: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.cep) {
        const normalized = data.cep.replace(/\D/g, '');
        if (normalized.length !== 8) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t('validation.cepInvalid'),
            path: ['cep'],
          });
          return;
        }
      }

      if (!data.street || data.street.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.streetRequired'),
          path: ['street'],
        });
      }

      if (!data.neighborhood || data.neighborhood.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.neighborhoodRequired'),
          path: ['neighborhood'],
        });
      }

      if (!data.city || data.city.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.cityRequired'),
          path: ['city'],
        });
      }

      if (!data.state || data.state.trim() === '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t('validation.stateRequired'),
          path: ['state'],
        });
      }
    });
}

export type ReportFormValues = z.infer<ReturnType<typeof createReportSchema>>;
