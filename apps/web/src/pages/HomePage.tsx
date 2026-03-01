import { useI18n } from '@/shared/i18n/useI18n';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { ThemeSwitcher } from '@/shared/components/ThemeSwitcher';
import { Card, CardContent } from '@/components/ui/card';
import { ReportForm } from '@/features/reports/components/ReportForm';
import {
  ClipboardTextIcon,
  MapPinIcon,
  LightningIcon,
  UsersFourIcon,
  BuildingsIcon,
} from '@phosphor-icons/react';

export function HomePage() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BuildingsIcon className="h-8 w-8 text-primary" weight="fill" />
              <h1 className="text-xl font-bold text-foreground">
                {t('header.siteName')}
              </h1>
            </div>
            <div className="flex flex-row items-center gap-3">
              <LanguageSwitcher />
              <ThemeSwitcher />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-8 py-8 sm:py-12">
        <div className="max-w-6xl mx-auto space-y-12">
          <section className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                {t('hero.title')}
              </h2>
              <p className="text-lg sm:text-xl text-muted-foreground font-medium">
                {t('hero.subtitle')}
              </p>
              <p className="text-base text-foreground/80 max-w-3xl leading-relaxed">
                {t('hero.description')}
              </p>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-2xl font-semibold text-foreground">
              {t('benefits.title')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                <ClipboardTextIcon className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" weight="fill" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">
                    {t('benefits.simple.title')}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t('benefits.simple.description')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                <MapPinIcon className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" weight="fill" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">
                    {t('benefits.location.title')}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t('benefits.location.description')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                <LightningIcon className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" weight="fill" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">
                    {t('benefits.routing.title')}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t('benefits.routing.description')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/30">
                <UsersFourIcon className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" weight="fill" />
                <div>
                  <h4 className="font-semibold text-foreground mb-1">
                    {t('benefits.civic.title')}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {t('benefits.civic.description')}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-2xl font-semibold text-foreground">
              {t('form.sectionTitle')}
            </h3>
            <Card>
              <CardContent>
                <ReportForm />
              </CardContent>
            </Card>
          </section>
        </div>
      </main>
    </div>
  );
}
