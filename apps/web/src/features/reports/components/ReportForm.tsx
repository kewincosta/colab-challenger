import { useForm } from '@tanstack/react-form';
import { useNavigate } from '@tanstack/react-router';
import { useEffect, useMemo } from 'react';
import type { StructuredLocation } from '../types/reportTypes';
import { createFieldSchemas } from '../validators/reportSchemas';
import { useSubmitReport } from '../hooks/useSubmitReport';
import { useCepLookup } from '../hooks/useCepLookup';
import { useI18n } from '@/shared/i18n/useI18n';
import { FormField } from '@/components/ui/form-field';
import { FormInputField } from '@/components/ui/form-input-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { extractErrors } from '@/lib/form-utils';
import { formatCep } from '@/lib/formatters';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { CircleNotchIcon } from '@phosphor-icons/react';

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

  const schemas = useMemo(() => createFieldSchemas(t), [t]);

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
        postcode: value.cep.replace(/\D/g, ''),
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

  const handleCepChange = (rawValue: string) => {
    clearCepError();
    lookup(rawValue);
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
      <form.Field name="title" validators={{ onBlur: schemas.title, onChange: schemas.title }}>
        {(field) => (
          <FormInputField
            field={field}
            id="title"
            label={t('form.titleLabel')}
            placeholder={t('form.titlePlaceholder')}
            required
          />
        )}
      </form.Field>

      <form.Field
        name="description"
        validators={{ onBlur: schemas.description, onChange: schemas.description }}
      >
        {(field) => {
          const showError = field.state.meta.isTouched && field.state.meta.errors.length > 0;
          return (
            <FormField
              label={t('form.descriptionLabel')}
              error={showError ? extractErrors(field.state.meta.errors) : undefined}
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
        <form.Field name="cep" validators={{ onBlur: schemas.cep, onChange: schemas.cep }}>
          {(field) => {
            const showError = field.state.meta.isTouched && field.state.meta.errors.length > 0;
            return (
              <FormField
                label={t('form.cepLabel')}
                error={showError ? extractErrors(field.state.meta.errors) : undefined}
                helper={t('form.cepHelper')}
                required
              >
                <div className="relative">
                  <Input
                    id="cep"
                    type="text"
                    value={field.state.value || ''}
                    onChange={(e) => {
                      const masked = formatCep(e.target.value);
                      field.handleChange(masked);
                      handleCepChange(masked);
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
          <form.Field
            name="street"
            validators={{ onBlur: schemas.street, onChange: schemas.street }}
          >
            {(field) => (
              <FormInputField
                field={field}
                id="street"
                label={t('form.streetLabel')}
                placeholder={t('form.streetPlaceholder')}
                disabled={isLookingUp}
                required
              />
            )}
          </form.Field>

          <form.Field name="number">
            {(field) => (
              <FormInputField
                field={field}
                id="number"
                label={t('form.numberLabel')}
                placeholder={t('form.numberPlaceholder')}
              />
            )}
          </form.Field>
        </div>

        <form.Field name="complement">
          {(field) => (
            <FormInputField
              field={field}
              id="complement"
              label={t('form.complementLabel')}
              placeholder={t('form.complementPlaceholder')}
            />
          )}
        </form.Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <form.Field
            name="neighborhood"
            validators={{ onBlur: schemas.neighborhood, onChange: schemas.neighborhood }}
          >
            {(field) => (
              <FormInputField
                field={field}
                id="neighborhood"
                label={t('form.neighborhoodLabel')}
                placeholder={t('form.neighborhoodPlaceholder')}
                disabled={isLookingUp}
                required
              />
            )}
          </form.Field>

          <form.Field name="city" validators={{ onBlur: schemas.city, onChange: schemas.city }}>
            {(field) => (
              <FormInputField
                field={field}
                id="city"
                label={t('form.cityLabel')}
                placeholder={t('form.cityPlaceholder')}
                disabled={isLookingUp}
                required
              />
            )}
          </form.Field>
        </div>

        <form.Field name="state" validators={{ onBlur: schemas.state, onChange: schemas.state }}>
          {(field) => (
            <FormInputField
              field={field}
              id="state"
              label={t('form.stateLabel')}
              placeholder={t('form.statePlaceholder')}
              maxLength={2}
              disabled={isLookingUp}
              className="uppercase"
              required
            />
          )}
        </form.Field>
      </div>

      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit]) => (
          <Button
            type="submit"
            variant="default"
            size="default"
            loading={isLoading}
            disabled={!canSubmit || isLoading}
            className="w-full"
          >
            {isLoading ? t('form.submitting') : t('form.submitButton')}
          </Button>
        )}
      </form.Subscribe>
    </form>
  );
}
