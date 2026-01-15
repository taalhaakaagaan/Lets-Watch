import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import translationEN from './locales/en/translation.json';
import translationTR from './locales/tr/translation.json';
import translationDE from './locales/de/translation.json';
import translationFR from './locales/fr/translation.json';
import translationES from './locales/es/translation.json';

const resources = {
    en: {
        translation: translationEN
    },
    tr: {
        translation: translationTR
    },
    de: {
        translation: translationDE
    },
    fr: {
        translation: translationFR
    },
    es: {
        translation: translationES
    }
};

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false // React already safes from xss
        },
        detection: {
            // Order of language detection
            order: ['localStorage', 'navigator'],
            // Cache user language on
            caches: ['localStorage']
        }
    });

export default i18n;
