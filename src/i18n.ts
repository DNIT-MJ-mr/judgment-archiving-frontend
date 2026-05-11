import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import arCommon from './locales/ar/common.json'
import arAuth from './locales/ar/auth.json'
import arNavigation from './locales/ar/navigation.json'
import arJudgments from './locales/ar/judgments.json'
import arBatches from './locales/ar/batches.json'
import arValidation from './locales/ar/validation.json'
import arDataEntry from './locales/ar/dataEntry.json'
import arDashboard from './locales/ar/dashboard.json'
import arErrors from './locales/ar/errors.json'
import arProfile from './locales/ar/profile.json'
import arUsers from './locales/ar/users.json'
import arCourts from './locales/ar/courts.json'
import arAdmin from './locales/ar/admin.json'
import arTemplates from './locales/ar/templates.json'

import frCommon from './locales/fr/common.json'
import frAuth from './locales/fr/auth.json'
import frNavigation from './locales/fr/navigation.json'
import frJudgments from './locales/fr/judgments.json'
import frBatches from './locales/fr/batches.json'
import frValidation from './locales/fr/validation.json'
import frDataEntry from './locales/fr/dataEntry.json'
import frDashboard from './locales/fr/dashboard.json'
import frErrors from './locales/fr/errors.json'
import frProfile from './locales/fr/profile.json'
import frUsers from './locales/fr/users.json'
import frCourts from './locales/fr/courts.json'
import frAdmin from './locales/fr/admin.json'
import frTemplates from './locales/fr/templates.json'

export const resources = {
  ar: {
    common: arCommon,
    auth: arAuth,
    navigation: arNavigation,
    judgments: arJudgments,
    batches: arBatches,
    validation: arValidation,
    dataEntry: arDataEntry,
    dashboard: arDashboard,
    errors: arErrors,
    profile: arProfile,
    users: arUsers,
    courts: arCourts,
    admin: arAdmin,
    templates: arTemplates,
  },
  fr: {
    common: frCommon,
    auth: frAuth,
    navigation: frNavigation,
    judgments: frJudgments,
    batches: frBatches,
    validation: frValidation,
    dataEntry: frDataEntry,
    dashboard: frDashboard,
    errors: frErrors,
    profile: frProfile,
    users: frUsers,
    courts: frCourts,
    admin: frAdmin,
    templates: frTemplates,
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ar',
    defaultNS: 'common',
    ns: [
      'common',
      'auth',
      'navigation',
      'judgments',
      'batches',
      'validation',
      'dataEntry',
      'dashboard',
      'errors',
      'profile',
      'users',
      'courts',
      'admin',
      'templates',
    ],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language',
    },
  })

export default i18n
