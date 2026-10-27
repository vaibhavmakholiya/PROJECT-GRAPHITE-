import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';

const savedLang = typeof localStorage !== 'undefined'
  ? localStorage.getItem('sanchay_language') || 'en'
  : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en,
      hi,
      mr,
    },
    lng: savedLang,
    fallbackLng: 'en',
    ns: ['common', 'public', 'member', 'admin'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

export const changeLanguage = (lang: 'en' | 'hi' | 'mr') => {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('sanchay_language', lang);
  }
  return i18n.changeLanguage(lang);
};

export default i18n;
