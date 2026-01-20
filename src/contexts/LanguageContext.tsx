import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import { useTranslation } from 'react-i18next'
import { STORAGE_KEYS } from '@/lib/constants'

type Language = 'ar' | 'fr'
type Direction = 'rtl' | 'ltr'

interface LanguageContextType {
  language: Language
  direction: Direction
  setLanguage: (lang: Language) => void
  toggleLanguage: () => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const { i18n } = useTranslation()
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.LANGUAGE)
    return (stored as Language) || 'ar'
  })

  const direction: Direction = language === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    // Update i18n language
    i18n.changeLanguage(language)
    
    // Update localStorage
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, language)
    
    // Update document direction and lang
    document.documentElement.dir = direction
    document.documentElement.lang = language
    
    // Update body class for font styling
    document.body.classList.remove('font-arabic', 'font-latin')
    document.body.classList.add(language === 'ar' ? 'font-arabic' : 'font-latin')
  }, [language, direction, i18n])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
  }, [])

  const toggleLanguage = useCallback(() => {
    setLanguageState((prev) => (prev === 'ar' ? 'fr' : 'ar'))
  }, [])

  const value: LanguageContextType = {
    language,
    direction,
    setLanguage,
    toggleLanguage,
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export default LanguageContext
