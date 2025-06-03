// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Attendance do plików z twoimi tłumaczeniami
import enTranslation from './locales/en/translation.json';
import plTranslation from './locales/pl/translation.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: enTranslation
      },
      pl: {
        translation: plTranslation
      }
    },
    lng: 'pl',            // domyślny język (możesz ustawić 'en' lub użyć localStorage)
    fallbackLng: 'en',    // jeśli brak tłumaczenia w wybranym, weź angielski
    interpolation: {
      escapeValue: false  // React sam rzuca XSS, więc nie używamy escape
    }
  });

export default i18n;
