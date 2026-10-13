'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/language/LanguageSwitcher'
import { Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SignOutButton } from '@/components/auth/SignOutButton'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export function NavigationHeader({
  onOpenAuth,
}: {
  onOpenAuth: (mode: 'login' | 'register') => void
}) {
  const { t } = useTranslation()
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkUser() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (session?.user) {
        setUserEmail(session.user.email || null)
      }
      setLoading(false)
    }

    checkUser()

    // Listen for auth state changes (login, logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || null)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUserEmail(null)
    router.refresh()
  }

  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between border-b border-border bg-card px-6 py-4">
      <div className="flex items-center gap-2 text-xl font-bold tracking-tight text-primary">
        <Zap size={20} fill="currentColor" className="text-primary" />
        Review Manager
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <LanguageSwitcher />

        {loading ? (
          <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
        ) : userEmail ? (
          // Authenticated View
          <div className="flex items-center gap-3">
            <span className="hidden text-xs font-medium text-muted-foreground sm:inline">
              {userEmail}
            </span>
            <Link
              href="/dashboard"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 transition hover:bg-primary/90"
            >
              Dashboard →
            </Link>
            <SignOutButton handleSignOut={handleSignOut} />
          </div>
        ) : (
          // Guest View
          <>
            <Button
              onClick={() => onOpenAuth('login')}
              className="px-3 py-1.5 text-sm font-medium text-foreground hover:text-primary"
              variant="ghost"
            >
              {t('nav.signIn')}
            </Button>
            <Button
              onClick={() => onOpenAuth('register')}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 transition hover:bg-primary/90"
            >
              {t('nav.getStarted')}
            </Button>
          </>
        )}
      </div>
    </header>
  )
}
