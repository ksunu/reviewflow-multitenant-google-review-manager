'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import { AuthModal } from '@/components/auth/AuthModal'
import { NavigationHeader } from '@/components/navbar/MainNavbar'
import { ClientOnlyWrapper } from '@/components/utils/ClientOnlyWrapper'

export default function LandingPage() {
  const { t } = useTranslation()
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register')

  const openAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode)
    setAuthModalOpen(true)
  }

  return (
    <ClientOnlyWrapper>
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <NavigationHeader
          onOpenAuth={(mode) => {
            setAuthMode(mode)
            setAuthModalOpen(true)
          }}
        />

        {/* Hero Section */}
        <section className="relative flex-1 flex flex-col items-center justify-center text-center px-6 py-20 max-w-4xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase">
            ✨ {t('hero.badge')}
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
            {t('hero.title1')} <br />
            <span className="text-primary">{t('hero.title2')}</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <button
              onClick={() => openAuth('register')}
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg transition shadow-md shadow-primary/20"
            >
              {t('hero.startTrial')}
            </button>
            <Link
              href="/dashboard"
              className="px-6 py-3 border border-border hover:bg-accent text-foreground font-medium rounded-lg transition"
            >
              {t('hero.viewDashboard')}
            </Link>
          </div>
        </section>

        {/* Value Proposition Grid */}
        <section className="bg-secondary/50 border-t border-border py-16 px-6">
          <div className="max-w-6xl mx-auto space-y-12">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">
                {t('features.title')}
              </h2>
              <p className="text-sm text-muted-foreground">{t('features.subtitle')}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-6 bg-card border border-border rounded-xl shadow-lg shadow-black/10 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
                  🚀
                </div>
                <h3 className="font-semibold text-lg">
                  {t('features.f1Title')}
                </h3>
                <p className="text-sm text-muted-foreground">{t('features.f1Desc')}</p>
              </div>

              <div className="p-6 bg-card border border-border rounded-xl shadow-lg shadow-black/10 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-sky-400/10 text-sky-300 flex items-center justify-center font-bold">
                  ⚡
                </div>
                <h3 className="font-semibold text-lg">
                  {t('features.f2Title')}
                </h3>
                <p className="text-sm text-muted-foreground">{t('features.f2Desc')}</p>
              </div>

              <div className="p-6 bg-card border border-border rounded-xl shadow-lg shadow-black/10 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-400/10 text-emerald-300 flex items-center justify-center font-bold">
                  ✍️
                </div>
                <h3 className="font-semibold text-lg">
                  {t('features.f3Title')}
                </h3>
                <p className="text-sm text-muted-foreground">{t('features.f3Desc')}</p>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-border py-8 px-6 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Review Manager SaaS. All rights
          reserved.
        </footer>

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authMode}
        />
      </div>
    </ClientOnlyWrapper>
  )
}
