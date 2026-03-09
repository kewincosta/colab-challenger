import { SunIcon, MoonIcon } from '@phosphor-icons/react';
import { useTheme } from '@/shared/theme/useTheme';
import { useI18n } from '@/shared/i18n/useI18n';
import { Button } from '@/components/ui/button';

export function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();

  const isDark = theme === 'dark';
  const ariaLabel = isDark ? t('header.switchToLight') : t('header.switchToDark');

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      aria-label={ariaLabel}
      className="h-9 min-w-[90px] gap-2"
    >
      {isDark ? (
        <>
          <SunIcon className="h-5 w-5" />
          {t('header.themeLight')}
        </>
      ) : (
        <>
          <MoonIcon className="h-5 w-5" />
          {t('header.themeDark')}
        </>
      )}
    </Button>
  );
}
