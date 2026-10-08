'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Star,
  MessageSquare,
  Sparkles,
  Filter,
  Loader2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Store,
  RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { generateAndSaveAIResponse } from './actions'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from 'sonner'
import { AIReplyDialog } from '@/components/ai/ai-reply-dialog'
import { syncLocationReviews } from '@/app/actions/syncReviews'

export default function WorkspaceReviewsPage() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const supabase = createClient()

  const [reviews, setReviews] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingId, setGeneratingId] = useState<string | null>(null)

  // Filters
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')

  //sync
  const [syncing, setSyncing] = useState(false)

  const handleSyncReviews = async () => {
    setSyncing(true)
    const result = await syncGoogleReviewsAction(locationId)

    if (!result.success) {
      alert(`Sync failed: ${result.error}`)
    } else {
      alert(`Successfully synced reviews!`)
      router.refresh()
    }
    setSyncing(false)

    // fake review sync for testing
    // setSyncing(true)
    // const toastId = toast.loading(
    //   'Syncing latest reviews from Google Places...',
    // )

    // try {
    //   const response = await fetch(`/api/workspaces/${workspaceId}/sync`, {
    //     method: 'POST',
    //   })
    //   const data = await response.json()

    //   if (!response.ok) throw new Error(data.error || 'Sync failed')

    //   toast.success('Successfully synchronized 1 new review!', { id: toastId })
    //   // Refresh your reviews state or router
    //   window.location.reload()
    // } catch (err: any) {
    //   console.error(err)
    //   toast.error(err.message || 'Failed to sync reviews.', { id: toastId })
    // } finally {
    //   setSyncing(false)
    // }
  }
  const loadReviewsData = async () => {
    try {
      const { data: locs } = await supabase
        .from('locations')
        .select('id, name')
        .eq('workspace_id', workspaceId)

      setLocations(locs || [])

      let query = supabase
        .from('reviews')
        .select(
          `
          *,
          locations ( name )
        `,
        )
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (selectedLocation !== 'all') {
        query = query.eq('location_id', selectedLocation)
      }

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus)
      }

      const { data: revs, error } = await query
      if (error) throw error
      setReviews(revs || [])
    } catch (err) {
      console.error('Error loading reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviewsData()
  }, [workspaceId, selectedLocation, selectedStatus])

  const handleGenerateAI = async (reviewId: string) => {
    setGeneratingId(reviewId)

    // Optional: show a loading toast if it takes a moment with local Ollama
    const toastId = toast.loading('Generating AI response with Ollama...')

    try {
      const result = await generateAndSaveAIResponse(reviewId, workspaceId)

      if (result.success) {
        setReviews(
          reviews.map((r) =>
            r.id === reviewId
              ? { ...r, ai_response: result.response, status: 'replied' }
              : r,
          ),
        )
        toast.success('AI response generated and saved successfully!', {
          id: toastId,
        })
      } else {
        toast.error('Failed to generate response: ' + result.error, {
          id: toastId,
        })
      }
    } catch (err) {
      console.error(err)
      toast.error('An unexpected error occurred.', { id: toastId })
    } finally {
      setGeneratingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'replied':
        return (
          <Badge
            variant="outline"
            className="bg-green-500/10 text-green-600 border-green-200 flex items-center gap-1"
          >
            <CheckCircle2 className="w-3 h-3" /> Replied
          </Badge>
        )
      case 'flagged':
        return (
          <Badge
            variant="outline"
            className="bg-red-500/10 text-red-600 border-red-200 flex items-center gap-1"
          >
            <AlertCircle className="w-3 h-3" /> Flagged
          </Badge>
        )
      default:
        return (
          <Badge
            variant="outline"
            className="bg-yellow-500/10 text-yellow-600 border-yellow-200 flex items-center gap-1"
          >
            <Clock className="w-3 h-3" /> Pending
          </Badge>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Review Feed</h1>
          <p className="text-muted-foreground text-sm">
            Monitor customer feedback across your store locations and generate
            AI responses.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncReviews}
            disabled={syncing}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync Reviews'}
          </Button>
          <Select value={selectedLocation} onValueChange={setSelectedLocation}>
            <SelectTrigger className="w-[180px]">
              <Store className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>
                  {loc.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[150px]">
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="replied">Replied</SelectItem>
              <SelectItem value="flagged">Flagged</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {reviews.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="w-6 h-6" />}
          title="No customer reviews found"
          description={
            selectedLocation !== 'all' || selectedStatus !== 'all'
              ? 'No reviews match your selected filter criteria. Try resetting your filters.'
              : 'No feedback has been synced for your workspace locations yet.'
          }
          actionLabel={
            selectedLocation !== 'all' || selectedStatus !== 'all'
              ? 'Clear Filters'
              : undefined
          }
          onAction={() => {
            setSelectedLocation('all')
            setSelectedStatus('all')
          }}
        />
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card
              key={review.id}
              className="hover:border-primary/40 transition-colors"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base">
                        {review.author_name}
                      </span>
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        {review.locations?.name || 'Store Location'}
                      </span>
                    </div>
                    <div className="flex items-center text-amber-500 gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-muted stroke-current'}`}
                        />
                      ))}
                      <span className="text-xs text-muted-foreground ml-2 font-mono">
                        {new Date(review.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div>{getStatusBadge(review.status)}</div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pb-4">
                <p className="text-sm text-foreground/90 bg-muted/30 p-3 rounded-lg border">
                  &ldquo;{review.review_text || 'No review_text text provided.'}
                  &rdquo;
                </p>

                {review.ai_response && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                      <Sparkles className="w-3.5 h-3.5" /> AI Drafted Response
                    </div>
                    <p className="text-sm text-foreground">
                      {review.ai_response}
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-2 border-t bg-muted/10 flex justify-between items-center text-xs">
                <span className="text-muted-foreground font-mono">
                  Source: Google Maps
                </span>

                {/* Context-Aware AI Reply Dialog Button */}
                <AIReplyDialog
                  workspaceId={workspaceId}
                  review={{
                    id: review.id,
                    rating: review.rating,
                    review_text: review.review_text,
                    author_name: review.author_name,
                  }}
                />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
