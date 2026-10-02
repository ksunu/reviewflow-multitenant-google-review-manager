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

interface AIReplyDialogProps {
  workspaceId: string
  review: {
    id: string
    rating: number
    comment: string
    author_name: string
  }
  onReplySaved?: () => void
}

export function AIReplyDialog({
  workspaceId,
  review,
  onReplySaved,
}: AIReplyDialogProps) {
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
      const res = await fetch(`/api/workspaces/${workspaceId}/ai-reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: review.id,
          rating: review.rating,
          comment: review.comment,
          internalContext,
          tone,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Generation failed')

      setGeneratedReply(data.reply)
      toast.success('AI reply generated successfully!')
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || 'Failed to generate response.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveToDatabase = async () => {
    if (!generatedReply) return
    setSaving(true)
    const toastId = toast.loading('Saving response to database...')

    try {
      // Assuming your reviews table has columns like ai_response and status
      const { error } = await supabase
        .from('reviews')
        .update({
          ai_response: generatedReply,
          status: 'replied',
        })
        .eq('id', review.id)

      if (error) throw error

      toast.success('Response saved and review marked as replied!', {
        id: toastId,
      })
      setOpen(false)

      // Trigger parent component refresh if provided
      if (onReplySaved) {
        onReplySaved()
      } else {
        window.location.reload()
      }
    } catch (err: any) {
      console.error('Save error:', err)
      toast.error(err.message || 'Failed to save response.', { id: toastId })
    } finally {
      setSaving(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedReply)
    setCopied(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs h-8 border-primary/30 hover:bg-primary/5 text-primary"
        >
          <Sparkles className="w-3.5 h-3.5" /> AI Reply
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Sparkles className="w-5 h-5 text-primary" /> AI Response Assistant
          </DialogTitle>
          <DialogDescription>
            Draft and save a tailored reply for {review.author_name}'s{' '}
            {review.rating}-star review.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Review Summary Box */}
          <div className="p-3 rounded-lg bg-muted/60 text-xs space-y-1">
            <div className="font-semibold text-foreground">
              Review ({review.rating} Stars):
            </div>
            <p className="text-muted-foreground italic">"{review.comment}"</p>
          </div>

          {/* Tone Selector */}
          <div className="space-y-2">
            <Label htmlFor="tone" className="text-xs font-medium">
              Response Tone
            </Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger id="tone" className="text-xs">
                <SelectValue placeholder="Select tone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="empathetic">
                  Empathetic & Polished
                </SelectItem>
                <SelectItem value="firm">Firm on Company Policy</SelectItem>
                <SelectItem value="dispute">
                  Professional Clarification (Fact Correction)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Internal Context Input */}
          <div className="space-y-2">
            <Label htmlFor="context" className="text-xs font-medium">
              Internal Context / Real Story (Optional)
            </Label>
            <Textarea
              id="context"
              placeholder="e.g., Customer was shouting at staff, item was final sale, or unverified bot review..."
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
            {loading ? 'Drafting Response...' : 'Generate AI Response'}
          </Button>

          {/* Generated Output Area */}
          {generatedReply && (
            <div className="space-y-2 pt-2 border-t">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-emerald-600">
                  Generated Draft (Editable)
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-7 text-xs gap-1"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  {copied ? 'Copied' : 'Copy'}
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
            Cancel
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
              Save & Mark Replied
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
