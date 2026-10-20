'use client'

import { useActionState } from 'react'
import { completeOnboardingAction } from '@/app/actions/onboarding'
import { useTranslation } from 'react-i18next'

export function OnboardingForm() {
  const { t } = useTranslation()
  const [state, formAction, pending] = useActionState(
    completeOnboardingAction,
    {},
  )

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <p
          role="alert"
          className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}

      <div>
        <label
          htmlFor="businessName"
          className="mb-1 block text-xs font-semibold uppercase text-muted-foreground"
        >
          {t('onboarding.businessName')}
        </label>
        <input
          id="businessName"
          name="businessName"
          type="text"
          required
          maxLength={120}
          placeholder={t('onboarding.businessPlaceholder')}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div>
        <label
          htmlFor="locationName"
          className="mb-1 block text-xs font-semibold uppercase text-muted-foreground"
        >
          {t('onboarding.locationName')}
        </label>
        <input
          id="locationName"
          name="locationName"
          type="text"
          required
          maxLength={120}
          placeholder={t('onboarding.locationPlaceholder')}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending
          ? t('onboarding.creating')
          : t('onboarding.complete')}
      </button>
    </form>
  )
}
