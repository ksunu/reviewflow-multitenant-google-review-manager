'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  useParams,
  useRouter,
  useSearchParams,
  usePathname,
} from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  MessageSquare,
  Filter,
  Loader2,
  Store,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { toast } from 'sonner'
import { syncLocationReviews } from '@/app/actions/syncReviews'
import ReviewCard from '@/app/dashboard/[workspaceId]/reviews/_components/review-card'
import type { Location, Review } from '@/types/models'

export default function WorkspaceReviewsPage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const workspaceId = params.workspaceId as string
  const supabase = useMemo(() => createClient(), [])

  // Read search params for pagination & filters
  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10
  const selectedLocation = searchParams.get('location') || 'all'
  const selectedStatus = searchParams.get('status') || 'all'

  const [reviews, setReviews] = useState<Review[]>([])
  const [locations, setLocations] = useState<Pick<Location, 'id' | 'name'>[]>([])
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
    const targetLocationId =
      selectedLocation !== 'all' ? selectedLocation : locations[0]?.id

    if (!targetLocationId) {
      toast.error('No locations available to sync.')
      return
    }

    setSyncing(true)
    try {
      const result = await syncLocationReviews(targetLocationId, workspaceId)

      if (!result.success) {
        toast.error(`Sync failed: ${result.error}`)
      } else {
        const count = result.count ?? 0
        toast.success(
          count === 0
            ? 'Sync complete. No new reviews found.'
            : `Synced ${count} new review${count === 1 ? '' : 's'}.`,
        )
        router.refresh()
      }
    } catch (error) {
      toast.error(
        `Sync failed: ${error instanceof Error ? error.message : 'Unexpected error'}`,
      )
    } finally {
      setSyncing(false)
    }
  }

  const loadReviewsData = useCallback(async () => {
    try {
      setLoading(true)
      if (locations.length === 0) {
        const { data: locs } = await supabase
          .from('locations')
          .select('id, name')
          .eq('workspace_id', workspaceId)

        setLocations((locs || []) as Pick<Location, 'id' | 'name'>[])
      }

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
        .order('review_date', { ascending: false })
        .range(from, to)

      if (selectedLocation !== 'all') {
        query = query.eq('location_id', selectedLocation)
      }

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus)
      }

      const { data: revs, count, error } = await query
      if (error) throw error

      setReviews((revs || []) as Review[])
      setTotalCount(count || 0)
    } catch (err) {
      console.error('Error loading reviews:', err)
    } finally {
      setLoading(false)
    }
  }, [locations.length, page, pageSize, selectedLocation, selectedStatus, supabase, workspaceId])

  useEffect(() => {
    void Promise.resolve().then(loadReviewsData)
  }, [loadReviewsData])

  return (
    // Fill the dashboard main area so pagination stays visible below the review scroller.
    <div className="flex min-h-0 flex-1 flex-col pb-4 w-full overflow-hidden">
      {/* Fixed Header & Filters */}
      <div className="shrink-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full pb-4 border-b">
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
            onValueChange={(val) => {
              if (val !== null) updateQueryParam({ location: val, page: '1' })
            }}
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
            onValueChange={(val) => {
              if (val !== null) updateQueryParam({ status: val, page: '1' })
            }}
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
            onValueChange={(val) => {
              if (val !== null) updateQueryParam({ pageSize: val, page: '1' })
            }}
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

      {/* Independently Scrollable Middle Content Area (Full Width) */}
      <div className="p-2 pl-1 flex-1 overflow-y-auto w-full py-4 min-h-0 ">
        {loading ? (
          <div className="flex h-full items-center justify-center w-full">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="w-full flex h-full items-center justify-center">
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
          </div>
        ) : (
          <div className="w-full space-y-4">
            {reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                workspaceId={workspaceId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fixed Footer Pagination Bar at the Bottom (Full Width) */}
      {!loading && totalPages > 0 && (
        <div className="shrink-0 flex items-center justify-between w-full pt-4 border-t bg-background">
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
