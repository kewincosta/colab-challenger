import { useForm } from '@tanstack/react-form';
import { useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';
import type { StructuredLocation } from '../types/reportTypes';
import { useSubmitReport } from '../hooks/useSubmitReport';
import { useCepLookup } from '../hooks/useCepLookup';
import { useI18n } from '@/shared/i18n/useI18n';
import { FormField } from '@/components/ui/form-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CircleNotchIcon } from '@phosphor-icons/react';

function formatCep(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function requiredValidator(msg: string) {
  return {
    onBlur: ({ value }: { value: string }) => (!value || value.trim() === '' ? msg : undefined),
    onChange: ({ value }: { value: string }) => (value && value.trim() !== '' ? undefined : msg),
  };
}

function minLengthValidator(min: number, requiredMsg: string, minMsg: string) {
  return {
    onBlur: ({ value }: { value: string }) => {
      if (!value || value.trim() === '') return requiredMsg;
      if (value.trim().length < min) return minMsg;
      return undefined;
    },
    onChange: ({ value }: { value: string }) => {
      if (!value || value.trim() === '') return requiredMsg;
      if (value.trim().length < min) return minMsg;
      return undefined;
    },
  };
}

function cepValidator(invalidMsg: string) {
  return {
    onBlur: ({ value }: { value: string }) => {
      if (!value || value.trim() === '') return undefined;
      const digits = value.replace(/\D/g, '');
      if (digits.length > 0 && digits.length !== 8) return invalidMsg;
      return undefined;
    },
    onChange: ({ value }: { value: string }) => {
      if (!value || value.trim() === '') return undefined;
      const digits = value.replace(/\D/g, '');
      if (digits.length > 0 && digits.length !== 8) return invalidMsg;
      return undefined;
    },
  };
}

export function ReportForm() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { submit, isLoading, error, clearError } = useSubmitReport();
  const {
    data: cepData,
    isLookingUp,
    error: cepError,
    lookup,
    clearError: clearCepError,
  } = useCepLookup();

  useEffect(() => {
    if (error) {
      toast({
        variant: 'destructive',
        title: t('errors.submissionFailed'),
        description: t('errors.submissionFailedMessage'),
        duration: 6000,
      });
    }
  }, [error, t]);

  useEffect(() => {
    if (cepError) {
      toast({
        variant: 'warning',
        title: cepError === 'CEP_NOT_FOUND' ? t('form.cepNotFound') : t('form.cepNetworkError'),
        description:
          cepError === 'CEP_NOT_FOUND'
            ? t('form.cepNotFoundMessage')
            : t('form.cepNetworkErrorMessage'),
        duration: 6000,
      });
    }
  }, [cepError, t]);

  const form = useForm({
    defaultValues: {
      title: '',
      description: '',
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      reference: '',
    },
    onSubmit: async ({ value }) => {
      clearError();

      const location: StructuredLocation = {
        street: value.street,
        number: value.number,
        complement: value.complement || undefined,
        neighborhood: value.neighborhood,
        city: value.city,
        state: value.state,
        postcode: value.cep?.replace(/\D/g, '') ?? '',
      };

      const response = await submit({
        title: value.title,
        description: value.description,
        location,
      });

      if (response) {
        const navigationState: Record<string, unknown> = {
          reportId: response.id,
          title: response.title,
          location,
          classificationStatus: response.classificationStatus,
        };
        void navigate({
          to: '/confirmation',
          state: navigationState,
        });
      }
    },
  });

  useEffect(() => {
    if (cepData) {
      form.setFieldValue('street', cepData.logradouro);
      form.setFieldValue('neighborhood', cepData.bairro);
      form.setFieldValue('city', cepData.localidade);
      form.setFieldValue('state', cepData.uf);
    }
  }, [cepData, form]);

  const handleCepChange = async (rawValue: string) => {
    const masked = formatCep(rawValue);
    form.setFieldValue('cep', masked);
    clearCepError();
    await lookup(masked);
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void form.handleSubmit();
      }}
      className="space-y-6"
    >
      <form.Field
        name="title"
        validators={minLengthValidator(
          5,
          t('validation.titleRequired'),
          t('validation.titleMinLength'),
        )}
      >
        {(field) => {
          const showError = field.state.meta.isTouched && field.state.meta.errors.length > 0;
          return (
            <FormField
              label={t('form.titleLabel')}
              error={showError ? [...new Set(field.state.meta.errors)].join(', ') : undefined}
              required
            >
              <Input
                id="title"
                type="text"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={t('form.titlePlaceholder')}
                className={cn('h-10 px-4', showError && 'border-destructive')}
              />
            </FormField>
          );
        }}
      </form.Field>

      <form.Field
        name="description"
        validators={minLengthValidator(
          15,
          t('validation.descriptionRequired'),
          t('validation.descriptionMinLength'),
        )}
      >
        {(field) => {
          const showError = field.state.meta.isTouched && field.state.meta.errors.length > 0;
          return (
            <FormField
              label={t('form.descriptionLabel')}
              error={showError ? [...new Set(field.state.meta.errors)].join(', ') : undefined}
              required
            >
              <textarea
                id="description"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={t('form.descriptionPlaceholder')}
                rows={4}
                className={cn(
                  'placeholder:text-muted-foreground border-input dark:bg-input/30 w-full rounded-md border bg-transparent px-4 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] md:text-sm',
                  'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
                  'resize-none',
                  showError && 'border-destructive',
                )}
              />
            </FormField>
          );
        }}
      </form.Field>

      <div className="space-y-4">
        <form.Field name="cep" validators={cepValidator(t('validation.cepInvalid'))}>
          {(field) => {
            const showError = field.state.meta.isTouched && field.state.meta.errors.length > 0;
            return (
              <FormField
                label={t('form.cepLabel')}
                error={showError ? [...new Set(field.state.meta.errors)].join(', ') : undefined}
                helper={t('form.cepHelper')}
              >
                <div className="relative">
                  <Input
                    id="cep"
                    type="text"
                    value={field.state.value || ''}
                    onChange={(e) => {
                      const masked = formatCep(e.target.value);
                      field.handleChange(masked);
                      void handleCepChange(masked);
                    }}
                    onBlur={field.handleBlur}
                    placeholder="00000-000"
                    maxLength={9}
                    className={cn('h-10 px-4', showError && 'border-destructive')}
                  />
                  {isLookingUp && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <CircleNotchIcon className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
              </FormField>
            );
          }}
        </form.Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <form.Field name="street" validators={requiredValidator(t('validation.streetRequired'))}>
            {(field) => {
              const showError = field.state.meta.isTouched && field.state.meta.errors.length > 0;
              return (
                <FormField
                  label={t('form.streetLabel')}
                  error={showError ? [...new Set(field.state.meta.errors)].join(', ') : undefined}
                  required
                >
                  <Input
                    id="street"
                    type="text"
                    value={field.state.value || ''}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder={t('form.streetPlaceholder')}
                    disabled={isLookingUp}
                    className={cn('h-10 px-4', showError && 'border-destructive')}
                  />
                </FormField>
              );
            }}
          </form.Field>

          <form.Field name="number">
            {(field) => (
              <FormField label={t('form.numberLabel')}>
                <Input
                  id="number"
                  type="text"
                  value={field.state.value || ''}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder={t('form.numberPlaceholder')}
                  className="h-10 px-4"
                />
              </FormField>
            )}
          </form.Field>
        </div>

        <form.Field name="complement">
          {(field) => (
            <FormField label={t('form.complementLabel')}>
              <Input
                id="complement"
                type="text"
                value={field.state.value || ''}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={t('form.complementPlaceholder')}
                className="h-10 px-4"
              />
            </FormField>
          )}
        </form.Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <form.Field
            name="neighborhood"
            validators={requiredValidator(t('validation.neighborhoodRequired'))}
          >
            {(field) => {
              const showError = field.state.meta.isTouched && field.state.meta.errors.length > 0;
              return (
                <FormField
                  label={t('form.neighborhoodLabel')}
                  error={showError ? [...new Set(field.state.meta.errors)].join(', ') : undefined}
                  required
                >
                  <Input
                    id="neighborhood"
                    type="text"
                    value={field.state.value || ''}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder={t('form.neighborhoodPlaceholder')}
                    disabled={isLookingUp}
                    className={cn('h-10 px-4', showError && 'border-destructive')}
                  />
                </FormField>
              );
            }}
          </form.Field>

          <form.Field name="city" validators={requiredValidator(t('validation.cityRequired'))}>
            {(field) => {
              const showError = field.state.meta.isTouched && field.state.meta.errors.length > 0;
              return (
                <FormField
                  label={t('form.cityLabel')}
                  error={showError ? [...new Set(field.state.meta.errors)].join(', ') : undefined}
                  required
                >
                  <Input
                    id="city"
                    type="text"
                    value={field.state.value || ''}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder={t('form.cityPlaceholder')}
                    disabled={isLookingUp}
                    className={cn('h-10 px-4', showError && 'border-destructive')}
                  />
                </FormField>
              );
            }}
          </form.Field>
        </div>

        <form.Field name="state" validators={requiredValidator(t('validation.stateRequired'))}>
          {(field) => {
            const showError = field.state.meta.isTouched && field.state.meta.errors.length > 0;
            return (
              <FormField
                label={t('form.stateLabel')}
                error={showError ? [...new Set(field.state.meta.errors)].join(', ') : undefined}
                required
              >
                <Input
                  id="state"
                  type="text"
                  value={field.state.value || ''}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                  placeholder={t('form.statePlaceholder')}
                  maxLength={2}
                  disabled={isLookingUp}
                  className={cn('h-10 px-4 uppercase', showError && 'border-destructive')}
                />
              </FormField>
            );
          }}
        </form.Field>

        <form.Field name="reference">
          {(field) => (
            <FormField label={t('form.referenceLabel')}>
              <Input
                id="reference"
                type="text"
                value={field.state.value || ''}
                onChange={(e) => field.handleChange(e.target.value)}
                onBlur={field.handleBlur}
                placeholder={t('form.referencePlaceholder')}
                className="h-10 px-4"
              />
            </FormField>
          )}
        </form.Field>
      </div>

      <form.Subscribe selector={(state) => state.values}>
        {(values) => {
          const isValid =
            values.title.trim().length >= 5 &&
            values.description.trim().length >= 15 &&
            (values.street ?? '').trim() !== '' &&
            (values.neighborhood ?? '').trim() !== '' &&
            (values.city ?? '').trim() !== '' &&
            (values.state ?? '').trim() !== '';

          return (
            <Button
              type="submit"
              variant="default"
              size="default"
              loading={isLoading}
              disabled={!isValid || isLoading}
              className="w-full"
            >
              {isLoading ? t('form.submitting') : t('form.submitButton')}
            </Button>
          );
        }}
      </form.Subscribe>
    </form>
  );
}
