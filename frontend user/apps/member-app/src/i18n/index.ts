import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';

const savedLanguage = localStorage.getItem('sanchay_lang') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      hi: { translation: hi },
      mr: { translation: mr },
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export function changeLanguage(lang: 'en' | 'hi' | 'mr') {
  i18n.changeLanguage(lang);
  localStorage.setItem('sanchay_lang', lang);
}

export default i18n;
