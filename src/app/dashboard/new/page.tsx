'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Building2, Loader2, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Link from 'next/link'
import type { CreateWorkspaceResult } from '@/types/models'
import { useTranslation } from 'react-i18next'

export default function NewWorkspacePage() {
  const { t } = useTranslation()
  const router = useRouter()
  const supabase = createClient()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Generate a clean slug
      const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')

      // Call the secure Postgres function (RPC)
      const { data, error: rpcError } = await supabase
        .rpc('create_workspace', {
          p_name: name.trim(),
          p_slug: slug,
        })
        .single()

      if (rpcError) throw rpcError
      const workspace = data as CreateWorkspaceResult | null
      if (!workspace) throw new Error('Failed to create workspace.')

      // Redirect to the newly created workspace dashboard
      router.push(`/dashboard/${workspace.id}`)
      router.refresh()
    } catch (err) {
      console.error('Error creating workspace:', err)
      setError(
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      )
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-4">
        <Button asChild variant="ghost" size="sm" className="mb-2">
          <Link href="/dashboard">
            <ArrowLeft className="w-4 h-4 mr-2" /> {t('workspace.backToDashboard')}
          </Link>
        </Button>

        <Card>
          <form onSubmit={handleCreateWorkspace}>
            <CardHeader>
              <div className="bg-primary/10 text-primary p-3 rounded-full w-fit mb-2">
                <Building2 className="w-6 h-6" />
              </div>
              <CardTitle className="text-xl">{t('workspace.createTitle')}</CardTitle>
              <CardDescription>
                {t('workspace.createDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">{t('workspace.nameLabel')}</Label>
                <Input
                  id="name"
                  placeholder={t('workspace.namePlaceholder')}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('workspace.creating')}
                  </>
                ) : (
                  t('workspace.createTitle')
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
