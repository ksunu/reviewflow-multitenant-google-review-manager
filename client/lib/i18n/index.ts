'use client'

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Static imports for reliable bundling in Next.js
import enCommon from '../../public/locales/en/common.json'
import esCommon from '../../public/locales/es/common.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
      },
      es: {
        common: esCommon,
      },
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common'],
    debug: false,
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  })

export default i18n
