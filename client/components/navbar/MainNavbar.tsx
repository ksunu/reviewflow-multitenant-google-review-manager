'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/language/LanguageSwitcher'

import { LogOut, Zap } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'

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
    <header className="border-b px-6 py-4 flex justify-between items-center max-w-7xl mx-auto w-full bg-white">
      <div className="font-bold text-xl tracking-tight text-purple-600 flex items-center gap-2">
        <Zap size={20} fill="yellow" />
        Review Manager
      </div>

      <div className="flex items-center gap-4">
        <LanguageSwitcher />

        {loading ? (
          <div className="w-24 h-8 bg-gray-100 rounded-md animate-pulse" />
        ) : userEmail ? (
          // Authenticated View
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500 hidden sm:inline font-medium">
              {userEmail}
            </span>
            <Link
              href="/dashboard"
              className="text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md transition shadow-sm"
            >
              Dashboard →
            </Link>
            <Popover>
              <PopoverTrigger
                openOnHover
                render={
                  <Button
                    onClick={handleSignOut}
                    variant="ghost"
                    className="cursor-pointer"
                    size="icon"
                  >
                    <LogOut size={16} />
                  </Button>
                }
              />
              <PopoverContent className="w-20 d-flex justify-center items-center text-sm text-gray-700">
                Sign Out
              </PopoverContent>
            </Popover>
          </div>
        ) : (
          // Guest View
          <>
            <Button
              onClick={() => onOpenAuth('login')}
              className="text-sm font-medium text-gray-700 hover:text-black px-3 py-1.5 cursor-pointer"
              variant="ghost"
            >
              {t('nav.signIn')}
            </Button>
            <Button
              onClick={() => onOpenAuth('register')}
              className="text-sm font-medium bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition shadow-sm cursor-pointer"
            >
              {t('nav.getStarted')}
            </Button>
          </>
        )}
      </div>
    </header>
  )
}
