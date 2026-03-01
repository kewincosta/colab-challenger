import type { ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { CheckCircleIcon, WarningCircleIcon, InfoIcon, WarningIcon } from '@phosphor-icons/react';

import { cn } from '@/lib/utils';

const alertVariants = cva(
  'relative w-full rounded-lg border px-4 py-3 text-sm grid has-[>svg]:grid-cols-[calc(var(--spacing)*4)_1fr] grid-cols-[0_1fr] has-[>svg]:gap-x-3 gap-y-0.5 items-start [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current',
  {
    variants: {
      variant: {
        default: 'bg-card text-card-foreground',
        destructive:
          'text-destructive bg-card [&>svg]:text-current *:data-[slot=alert-description]:text-destructive/90',
        success:
          'border-green-500/50 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100 [&>svg]:text-current',
        warning:
          'border-amber-500/50 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100 [&>svg]:text-current',
        info: 'border-blue-500/50 bg-blue-50 text-blue-900 dark:bg-blue-950 dark:text-blue-100 [&>svg]:text-current',
        error:
          'border-red-500/50 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100 [&>svg]:text-current',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const iconMap = {
  success: CheckCircleIcon,
  error: WarningCircleIcon,
  warning: WarningIcon,
  info: InfoIcon,
} as const;

type AlertVariant = NonNullable<VariantProps<typeof alertVariants>['variant']>;

function Alert({
  className,
  variant,
  ...props
}: ComponentProps<'div'> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-title"
      className={cn('col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight', className)}
      {...props}
    />
  );
}

function AlertDescription({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="alert-description"
      className={cn(
        'text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed',
        className,
      )}
      {...props}
    />
  );
}

/**
 * Convenience wrapper that renders an Alert with auto-icon, title and description.
 * Useful for quick feedback messages (success, error, warning, info).
 */
function AlertBanner({
  variant = 'info',
  title,
  message,
  className,
}: {
  variant?: AlertVariant;
  title?: string;
  message: React.ReactNode;
  className?: string;
}) {
  const IconComp = variant && variant in iconMap ? iconMap[variant as keyof typeof iconMap] : null;

  return (
    <Alert variant={variant} className={className}>
      {IconComp && <IconComp className="size-4" weight="fill" />}
      {title && <AlertTitle>{title}</AlertTitle>}
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export { Alert, AlertTitle, AlertDescription, AlertBanner, alertVariants };
export type { AlertVariant };
