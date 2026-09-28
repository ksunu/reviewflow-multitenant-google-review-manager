'use client'

import { ClientOnlyWrapper } from '@/components/utils/ClientOnlyWrapper'
import { useTranslation } from 'react-i18next'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const changeLanguage = (lng: string) => i18n.changeLanguage(lng)

  const currentLang = i18n.language || 'en'

  return (
    <ClientOnlyWrapper>
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-md text-xs font-medium">
        <button
          onClick={() => changeLanguage('en')}
          className={`px-2 py-1 rounded transition ${!currentLang.startsWith('es') ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
        >
          EN
        </button>
        <button
          onClick={() => changeLanguage('es')}
          className={`px-2 py-1 rounded transition ${currentLang.startsWith('es') ? 'bg-white shadow-sm text-black' : 'text-gray-500 hover:text-black'}`}
        >
          ES
        </button>
      </div>
    </ClientOnlyWrapper>
  )
}
