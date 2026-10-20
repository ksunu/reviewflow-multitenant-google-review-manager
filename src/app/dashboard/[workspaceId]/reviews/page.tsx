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
import ReviewCard from '@/app/dashboard/[workspaceId]/reviews/_components/review-card'
import type { Location, Review } from '@/types/models'
import { useTranslation } from 'react-i18next'

export default function WorkspaceReviewsPage() {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { t } = useTranslation()

  const workspaceId = params.workspaceId as string
  const supabase = useMemo(() => createClient(), [])

  // Read search params for pagination & filters
  const page = Number(searchParams.get('page')) || 1
  const pageSize = Number(searchParams.get('pageSize')) || 10
  const selectedLocation = searchParams.get('location') || 'all'
  const selectedStatus = searchParams.get('status') || 'all'

  const [reviews, setReviews] = useState<Review[]>([])
  const [locations, setLocations] = useState<Pick<Location, 'id' | 'name'>[]>(
    [],
  )
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

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
  }, [
    locations.length,
    page,
    pageSize,
    selectedLocation,
    selectedStatus,
    supabase,
    workspaceId,
  ])

  useEffect(() => {
    void Promise.resolve().then(loadReviewsData)
  }, [loadReviewsData])

  return (
    // Fill the dashboard main area so pagination stays visible below the review scroller.
    <div className="flex min-h-0 flex-1 flex-col pb-4 w-full overflow-hidden">
      {/* Fixed Header & Filters */}
      <div className="shrink-0 flex flex-col md:flex-row md:items-center md:justify-between gap-4 w-full pb-4 border-b">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t('reviews.title')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('reviews.description')}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Location Filter */}
          <Select
            value={selectedLocation}
            onValueChange={(val) => {
              if (val !== null) updateQueryParam({ location: val, page: '1' })
            }}
          >
            <SelectTrigger className="w-[180px]">
              <Store className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder={t('reviews.allLocations')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('reviews.allLocations')}</SelectItem>
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
              <SelectValue placeholder={t('reviews.allStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('reviews.allStatus')}</SelectItem>
              <SelectItem value="pending">{t('reviews.pending')}</SelectItem>
              <SelectItem value="replied">{t('reviews.replied')}</SelectItem>
              <SelectItem value="flagged">{t('reviews.flagged')}</SelectItem>
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
              <SelectValue placeholder={t('reviews.perPage', { count: 10 })} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">
                {t('reviews.perPage', { count: 10 })}
              </SelectItem>
              <SelectItem value="25">
                {t('reviews.perPage', { count: 25 })}
              </SelectItem>
              <SelectItem value="50">
                {t('reviews.perPage', { count: 50 })}
              </SelectItem>
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
              title={t('reviews.emptyTitle')}
              description={
                selectedLocation !== 'all' || selectedStatus !== 'all'
                  ? t('reviews.filteredEmpty')
                  : t('reviews.emptyDescription')
              }
              actionLabel={
                selectedLocation !== 'all' || selectedStatus !== 'all'
                  ? t('reviews.clearFilters')
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
            {t('reviews.showing', {
              start: totalCount === 0 ? 0 : (page - 1) * pageSize + 1,
              end: Math.min(page * pageSize, totalCount),
              count: totalCount,
            })}
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => updateQueryParam({ page: (page - 1).toString() })}
            >
              <ChevronLeft className="w-4 h-4 mr-1" /> {t('reviews.previous')}
            </Button>
            <span className="text-sm font-medium px-2">
              {t('reviews.page', { current: page, total: totalPages || 1 })}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => updateQueryParam({ page: (page + 1).toString() })}
            >
              {t('reviews.next')} <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
