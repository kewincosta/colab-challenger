import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useI18n } from '@/shared/i18n/useI18n';
import { Button } from '@/components/ui/button';
import { ConfirmationSummary } from '@/features/reports/components/ConfirmationSummary';
import { CheckCircleIcon, ArrowLeftIcon } from '@phosphor-icons/react';
import type { StructuredLocation } from '@/features/reports/types/reportTypes';

interface ConfirmationState {
  reportId: string;
  title: string;
  location: StructuredLocation;
  classificationStatus: string;
}

export function ConfirmationPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const routerState = useRouterState();

  const state = routerState.location.state as unknown as ConfirmationState | undefined;

  const handleBackToHome = () => {
    void navigate({ to: '/' });
  };

  if (!state?.reportId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">No confirmation data available</p>
          <Button onClick={handleBackToHome}>
            <ArrowLeftIcon className="h-5 w-5" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
              <CheckCircleIcon
                className="h-10 w-10 text-green-600 dark:text-green-400"
                weight="fill"
              />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              {t('confirmation.title')}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl">
              {t('confirmation.message')}
            </p>
          </div>

          <ConfirmationSummary title={state.title} location={state.location} />

          <div className="flex justify-center">
            <Button onClick={handleBackToHome} size="default" variant="default">
              {t('confirmation.cta')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
