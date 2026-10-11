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
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-6 relative">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === 'login'
              ? 'Welcome Back to Review Manager'
              : 'Start Your Free AI Journey'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-sm font-semibold"
          >
            ✕
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 text-xs bg-red-50 text-red-600 rounded-md border border-red-200">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              {t('auth.emailAddress')}
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="manager@yourbusiness.com"
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
              {t('auth.password')}
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md transition shadow-sm text-sm disabled:opacity-50 cursor-pointer"
          >
            {loading
              ? t('auth.processing')
              : mode === 'login'
                ? t('auth.login')
                : t('auth.createAccount')}
          </Button>
        </form>

        <div className="text-center text-xs text-gray-500 pt-2 border-t">
          {mode === 'login' ? (
            <p>
              Don&apos;t have an account?{' '}
              <button
                onClick={() => setMode('register')}
                className="text-purple-600 font-semibold hover:underline cursor-pointer"
              >
                {t('auth.register')}
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                onClick={() => setMode('login')}
                className="text-purple-600 font-semibold hover:underline cursor-pointer"
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
