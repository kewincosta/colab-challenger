import { RouterProvider } from '@tanstack/react-router';
import { I18nProvider } from './shared/i18n/useI18n';
import { ThemeProvider } from './shared/theme/useTheme';
import { Toaster } from './components/ui/toaster';
import { router } from './router';

function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <RouterProvider router={router} />
        <Toaster />
      </I18nProvider>
    </ThemeProvider>
  );
}

export default App;