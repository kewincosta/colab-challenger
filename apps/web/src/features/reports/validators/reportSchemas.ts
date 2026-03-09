import { z } from 'zod';

export function createFieldSchemas(t: (key: string) => string) {
  return {
    title: z
      .string()
      .min(1, { message: t('validation.titleRequired') })
      .min(5, { message: t('validation.titleMinLength') })
      .max(255, { message: t('validation.titleMaxLength') }),

    description: z
      .string()
      .min(1, { message: t('validation.descriptionRequired') })
      .min(15, { message: t('validation.descriptionMinLength') }),

    cep: z
      .string()
      .min(1, { message: t('validation.cepRequired') })
      .regex(/^\d{5}-?\d{3}$/, { message: t('validation.cepInvalid') }),

    street: z.string().min(1, { message: t('validation.streetRequired') }),

    number: z.string().optional(),

    complement: z.string().optional(),

    neighborhood: z.string().min(1, { message: t('validation.neighborhoodRequired') }),

    city: z.string().min(1, { message: t('validation.cityRequired') }),

    state: z
      .string()
      .min(1, { message: t('validation.stateRequired') })
      .regex(/^[A-Z]{2}$/, { message: t('validation.stateInvalid') }),
  };
}

export function createReportSchema(t: (key: string) => string) {
  const fields = createFieldSchemas(t);
  return z.object(fields);
}

export type ReportFormValues = z.infer<ReturnType<typeof createReportSchema>>;
