'use client'

import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const languages = [
    { value: 'en', label: 'EN', text: 'English' },
    { value: 'es', label: 'ES', text: 'Spanish' },
  ]

  const changeLanguage = (lng: string | null) => i18n.changeLanguage(lng!)

  const currentLang = i18n.language || languages[0].value

  return (
    <Select
      defaultValue={currentLang}
      value={currentLang}
      onValueChange={changeLanguage}
      items={languages}
    >
      <SelectTrigger className="w-20">
        <SelectValue placeholder={currentLang.toUpperCase()} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {languages.map((item) => (
            <SelectItem key={item.value} value={item.value}>
              {item.text}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
