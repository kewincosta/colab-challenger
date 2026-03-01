import { useNavigate, useRouterState } from '@tanstack/react-router';
import { useI18n } from '@/shared/i18n/useI18n';
import { Button } from '@/components/ui/button';
import { ConfirmationSummary } from '@/features/reports/components/ConfirmationSummary';
import { CheckCircleIcon, ArrowLeftIcon, BuildingsIcon } from '@phosphor-icons/react';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { ThemeSwitcher } from '@/shared/components/ThemeSwitcher';
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
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 sm:px-8 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <BuildingsIcon className="h-8 w-8 text-primary" weight="fill" />
                <h1 className="text-xl font-bold text-foreground">{t('header.siteName')}</h1>
              </div>
              <div className="flex flex-row items-center gap-3">
                <LanguageSwitcher />
                <ThemeSwitcher />
              </div>
            </div>
          </div>
        </header>
        <div
          className="flex items-center justify-center p-4"
          style={{ minHeight: 'calc(100vh - 73px)' }}
        >
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">{t('confirmation.noData')}</p>
            <Button onClick={handleBackToHome}>
              <ArrowLeftIcon className="h-5 w-5" />
              {t('confirmation.backToHome')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BuildingsIcon className="h-8 w-8 text-primary" weight="fill" />
              <h1 className="text-xl font-bold text-foreground">{t('header.siteName')}</h1>
            </div>
            <div className="flex flex-row items-center gap-3">
              <LanguageSwitcher />
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </header>
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
