'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import disposableDomains from 'disposable-email-domains'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
}

export function AuthModal({
  isOpen,
  onClose,
  initialMode = 'register',
}: AuthModalProps) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg(null)
    if (mode === 'register') {
      const domain = email.split('@')[1].toLowerCase()
      if (disposableDomains.includes(domain)) {
        throw new Error(t('auth.message.disposableEmail'))
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) {
        setErrorMsg(error.message)
      } else {
        alert(t('auth.message.registrationSuccess'))
        setMode('login')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setErrorMsg(error.message)
      } else {
        onClose()
        router.push('/dashboard')
        router.refresh()
      }
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md space-y-6 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-2xl shadow-black/30">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-foreground">
            {mode === 'login'
              ? 'Welcome Back to Review Manager'
              : 'Start Your Free AI Journey'}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
              {t('auth.emailAddress')}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('auth.emailPlaceholder')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-muted-foreground uppercase mb-1">
              {t('auth.password')}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground shadow-sm shadow-primary/20 transition hover:bg-primary/90 disabled:opacity-50"
          >
            {loading
              ? t('auth.processing')
              : mode === 'login'
                ? t('auth.login')
                : t('auth.createAccount')}
          </Button>
        </form>

        <div className="border-t border-border pt-2 text-center text-xs text-muted-foreground">
          {mode === 'login' ? (
            <p>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => setMode('register')}
                className="cursor-pointer font-semibold text-primary hover:underline"
              >
                {t('auth.register')}
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => setMode('login')}
                className="cursor-pointer font-semibold text-primary hover:underline"
              >
                {t('auth.login')}
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
