import { GlobeIcon } from '@phosphor-icons/react';
import { useI18n } from '@/shared/i18n/useI18n';
import { Language } from '@/shared/i18n/translations';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();

  return (
    <div className="flex items-center gap-2">
      <GlobeIcon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      <Select value={lang} onValueChange={(value) => setLang(value as Language)}>
        <SelectTrigger
          className="w-auto min-w-[120px]"
          aria-label={t('header.selectLanguage')}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ptBR">{t('header.langPTFull')}</SelectItem>
          <SelectItem value="enUS">{t('header.langENFull')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
