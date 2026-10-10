'use client'

import { useState, useEffect } from 'react'
import {
  useParams,
  useRouter,
  useSearchParams,
  usePathname,
} from 'next/navigation'
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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card'
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
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const workspaceId = params.workspaceId as string
  const supabase = createClient()

  // Read search params for pagination & filters
  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10
  const selectedLocation = searchParams.get('location') || 'all'
  const selectedStatus = searchParams.get('status') || 'all'

  const [reviews, setReviews] = useState<any[]>([])
  const [locations, setLocations] = useState<any[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const totalPages = Math.ceil(totalCount / pageSize)

  // Helper to update URL search parameters dynamically
  const updateQueryParam = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value === 'all' && (key === 'location' || key === 'status')) {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleSyncReviews = async () => {
    setSyncing(true)
    // If a specific location is selected, sync that location; otherwise sync the first available or let action handle it
    const targetLocationId =
      selectedLocation !== 'all' ? selectedLocation : locations[0]?.id

    if (!targetLocationId) {
      toast.error('No locations available to sync.')
      setSyncing(false)
      return
    }

    const result = await syncLocationReviews(targetLocationId, workspaceId)
    setSyncing(false)

    if (!result.success) {
      toast.error(`Sync failed: ${result.error}`)
    } else {
      toast.success('Successfully synced reviews!')
      router.refresh()
    }
  }

  const loadReviewsData = async () => {
    try {
      setLoading(true)
      // Fetch locations dropdown data if not already loaded
      if (locations.length === 0) {
        const { data: locs } = await supabase
          .from('locations')
          .select('id, name')
          .eq('workspace_id', workspaceId)

        setLocations(locs || [])
      }

      // Calculate range for pagination
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1

      let query = supabase
        .from('reviews')
        .select(
          `
          *,
          locations ( name )
        `,
          { count: 'exact' },
        )
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .range(from, to)

      if (selectedLocation !== 'all') {
        query = query.eq('location_id', selectedLocation)
      }

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus)
      }

      const { data: revs, count, error } = await query
      if (error) throw error

      setReviews(revs || [])
      setTotalCount(count || 0)
    } catch (err) {
      console.error('Error loading reviews:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReviewsData()
  }, [workspaceId, page, pageSize, selectedLocation, selectedStatus])

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

          {/* Location Filter */}
          <Select
            value={selectedLocation}
            onValueChange={(val) =>
              updateQueryParam({ location: val, page: '1' })
            }
          >
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

          {/* Status Filter */}
          <Select
            value={selectedStatus}
            onValueChange={(val) =>
              updateQueryParam({ status: val, page: '1' })
            }
          >
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

          {/* Rows per page selector */}
          <Select
            value={pageSize.toString()}
            onValueChange={(val) =>
              updateQueryParam({ pageSize: val, page: '1' })
            }
          >
            <SelectTrigger className="w-[90px]">
              <SelectValue placeholder="10 / page" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="25">25 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : reviews.length === 0 ? (
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
            updateQueryParam({ location: 'all', status: 'all', page: '1' })
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
                  &ldquo;{review.review_text || 'No review text provided.'}
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

      {/* Pagination Controls Footer */}
      {!loading && totalPages > 0 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Showing {totalCount === 0 ? 0 : (page - 1) * pageSize + 1} to{' '}
            {Math.min(page * pageSize, totalCount)} of {totalCount} reviews
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateQueryParam({ page: (page - 1).toString() })}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> Previous
            </Button>
            <span className="text-sm font-medium px-2">
              Page {page} of {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => updateQueryParam({ page: (page + 1).toString() })}
            >
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
