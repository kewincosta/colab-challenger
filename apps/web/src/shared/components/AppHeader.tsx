import { BuildingsIcon } from '@phosphor-icons/react';
import { useI18n } from '@/shared/i18n/useI18n';
import { LanguageSwitcher } from '@/shared/components/LanguageSwitcher';
import { ThemeSwitcher } from '@/shared/components/ThemeSwitcher';

export function AppHeader() {
  const { t } = useI18n();

  return (
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
  );
}
