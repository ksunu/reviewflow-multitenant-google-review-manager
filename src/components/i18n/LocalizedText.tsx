'use client'

import { useTranslation } from 'react-i18next'

/** Allows server-rendered route shells to use the active client locale. */
export function LocalizedText({
  i18nKey,
}: {
  i18nKey: string
}) {
  const { t } = useTranslation()
  return <>{t(i18nKey)}</>
}
