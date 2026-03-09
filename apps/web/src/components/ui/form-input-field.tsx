import type { ComponentProps } from 'react';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { extractErrors } from '@/lib/form-utils';
import { cn } from '@/lib/utils';

interface FieldState {
  state: {
    value: string;
    meta: { isTouched: boolean; errors: unknown[] };
  };
  handleChange: (value: string) => void;
  handleBlur: () => void;
}

interface FormInputFieldProps extends Omit<
  ComponentProps<typeof Input>,
  'value' | 'onChange' | 'onBlur'
> {
  field: FieldState;
  label: string;
  required?: boolean;
  helper?: string;
}

export function FormInputField({
  field,
  label,
  required,
  helper,
  className,
  ...inputProps
}: FormInputFieldProps) {
  const showError = field.state.meta.isTouched && field.state.meta.errors.length > 0;

  return (
    <FormField
      label={label}
      error={showError ? extractErrors(field.state.meta.errors) : undefined}
      helper={helper}
      required={required}
    >
      <Input
        value={field.state.value || ''}
        onChange={(e) => field.handleChange(e.target.value)}
        onBlur={field.handleBlur}
        className={cn('h-10 px-4', showError && 'border-destructive', className)}
        {...inputProps}
      />
    </FormField>
  );
}
