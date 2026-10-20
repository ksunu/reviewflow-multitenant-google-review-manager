// src/components/ai/ai-reply-dialog.tsx
'use client'

import { useState } from 'react'
import { Sparkles, Loader2, Copy, Check, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { AIReplyReview } from '@/types/models'
import { useTranslation } from 'react-i18next'

interface AIReplyDialogProps {
  workspaceId: string
  review: AIReplyReview
  onReplySaved?: () => void
}

export function AIReplyDialog({
  workspaceId,
  review,
  onReplySaved,
}: AIReplyDialogProps) {
  const { t } = useTranslation()
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [tone, setTone] = useState('empathetic')
  const [internalContext, setInternalContext] = useState('')
  const [generatedReply, setGeneratedReply] = useState('')
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    setLoading(true)
    setGeneratedReply('')
    try {
      // Matches the API route path we configured
      const res = await fetch(`/api/workspaces/${workspaceId}/ai-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: review.id,
          internalContext,
          tone,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        if (data.requiresUpgrade) {
          toast.error(data.error)
          return
        }
        throw new Error(data.error || 'Generation failed')
      }

      setGeneratedReply(data.reply)
      toast.success(t('ai.generateSuccess'))
    } catch (err) {
      console.error(err)
      toast.error(err instanceof Error ? err.message : t('ai.generateFailed'))
    } finally {
      setLoading(false)
    }
  }

  const handleSaveToDatabase = async () => {
    if (!generatedReply) return
    setSaving(true)
    const toastId = toast.loading(t('ai.saveLoading'))

    try {
      const { error } = await supabase
        .from('reviews')
        .update({
          ai_reply_draft: generatedReply,
          reply_status: 'drafted',
          status: 'replied',
        })
        .eq('id', review.id)
        .eq('workspace_id', workspaceId)

      if (error) throw error

      toast.success(t('ai.saveSuccess'), {
        id: toastId,
      })
      setOpen(false)

      if (onReplySaved) {
        onReplySaved()
      } else {
        window.location.reload()
      }
    } catch (err) {
      console.error('Save error:', err)
      toast.error(err instanceof Error ? err.message : t('ai.saveFailed'), { id: toastId })
    } finally {
      setSaving(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedReply)
    setCopied(true)
    toast.success(t('ai.copied'))
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-8 border-primary/30 hover:bg-primary/5 text-primary"
          >
            <Sparkles className="w-3.5 h-3.5" /> {t('ai.button')}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-primary" /> {t('ai.title')}
          </DialogTitle>
          <DialogDescription>
            {t('ai.description', { author: review.author_name, rating: review.rating })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Review Summary Box */}
          <div className="p-3 rounded-lg bg-muted/60 text-xs space-y-1">
            <div className="font-semibold text-foreground">
              {t('ai.reviewSummary', { rating: review.rating })}
            </div>
            <p className="text-muted-foreground italic">
              &quot;{review.review_text}&quot;
            </p>
          </div>

          {/* Tone Selector */}
          <div className="space-y-2">
            <Label htmlFor="tone" className="text-xs font-medium">
              {t('ai.tonePlaceholder')}
            </Label>
            <Select
              value={tone}
              onValueChange={(value) => {
                if (value !== null) setTone(value)
              }}
            >
              <SelectTrigger id="tone" className="text-xs">
                <SelectValue placeholder={t('ai.tonePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="empathetic">
                  {t('ai.empathetic')}
                </SelectItem>
                <SelectItem value="firm">{t('ai.firm')}</SelectItem>
                <SelectItem value="dispute">
                  {t('ai.dispute')}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Internal Context Input */}
          <div className="space-y-2">
            <Label htmlFor="context" className="text-xs font-medium">
              {t('ai.contextLabel')}
            </Label>
            <Textarea
              id="context"
              placeholder={t('ai.contextPlaceholder')}
              value={internalContext}
              onChange={(e) => setInternalContext(e.target.value)}
              className="text-xs h-20 resize-none"
            />
          </div>

          <Button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full gap-2 text-xs"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {loading ? t('ai.drafting') : t('ai.generate')}
          </Button>

          {/* Generated Output Area */}
          {generatedReply && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-emerald-400">
                  {t('ai.generatedDraft')}
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-7 text-xs gap-1"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? t('ai.copied') : t('ai.copy')}
                </Button>
              </div>
              <Textarea
                value={generatedReply}
                onChange={(e) => setGeneratedReply(e.target.value)}
                className="text-xs h-28 leading-relaxed text-foreground"
              />
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-between items-center sm:justify-between">
          <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
            {t('ai.cancel')}
          </Button>
          {generatedReply && (
            <Button
              size="sm"
              onClick={handleSaveToDatabase}
              disabled={saving}
              className="gap-1.5"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {t('ai.saveReply')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
