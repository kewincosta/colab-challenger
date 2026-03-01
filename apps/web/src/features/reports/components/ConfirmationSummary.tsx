import { useI18n } from '@/shared/i18n/useI18n';
import { Card, CardContent } from '@/components/ui/card';
import type { StructuredLocation } from '../types/reportTypes';
import { MapPinIcon } from '@phosphor-icons/react';

interface ConfirmationSummaryProps {
  title: string;
  location: StructuredLocation;
}

export function ConfirmationSummary({
  title,
  location,
}: ConfirmationSummaryProps) {
  const { t } = useI18n();

  const addressLine = [
    location.street,
    location.number,
    location.complement,
    location.neighborhood,
    location.city,
    location.state,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <Card>
      <CardContent className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground">
          {t('confirmation.summaryTitle')}
        </h3>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              {t('confirmation.reportTitle')}
            </label>
            <p className="text-base text-foreground mt-1">{title}</p>
          </div>

          <div>
            <label className="text-sm font-medium text-muted-foreground">
              {t('confirmation.locationMethod')}
            </label>
            <div className="flex items-center gap-2 mt-1">
              <MapPinIcon className="h-5 w-5 text-primary" />
              <span className="text-base text-foreground">{addressLine}</span>
            </div>
          </div>

          {location.postcode && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                {t('confirmation.cep')}
              </label>
              <p className="text-base text-foreground mt-1 font-mono">
                {location.postcode.replace(/^(\d{5})(\d{3})$/, '$1-$2')}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
