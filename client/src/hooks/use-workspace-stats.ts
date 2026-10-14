// src/hooks/use-workspace-stats.ts
'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { WorkspaceReviewStats, RatingDistributionItem } from '@/types/stats'

export function useWorkspaceStats(
  workspaceIds: string[] = [],
  selectedWorkspaceId: string = 'all',
) {
  const [stats, setStats] = useState<WorkspaceReviewStats | null>(null)
  const [ratingDistribution, setRatingDistribution] = useState<
    RatingDistributionItem[]
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  // 1. Memoize workspace IDs key so reference stays identical across parent re-renders
  const workspaceIdsKey = useMemo(() => {
    if (!Array.isArray(workspaceIds)) return ''
    return workspaceIds.filter(Boolean).sort().join(',')
  }, [workspaceIds])

  const fetchStats = useCallback(async () => {
    const validIds = workspaceIdsKey ? workspaceIdsKey.split(',') : []

    if (validIds.length === 0) {
      setStats({
        workspace_id: 'all',
        total_reviews: 0,
        average_rating: 0,
        positive_count: 0,
        neutral_count: 0,
        negative_count: 0,
        posted_replies_count: 0,
      })
      setRatingDistribution([
        { rating: 5, count: 0 },
        { rating: 4, count: 0 },
        { rating: 3, count: 0 },
        { rating: 2, count: 0 },
        { rating: 1, count: 0 },
      ])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const isAll = !selectedWorkspaceId || selectedWorkspaceId === 'all'
      const targetIds = isAll ? validIds : [selectedWorkspaceId]

      // 2. Query stats from the view
      const { data: statsData, error: statsError } = await supabase
        .from('workspace_review_stats')
        .select('*')
        .in('workspace_id', targetIds)
      console.log('1111', statsData)
      if (statsError) throw statsError

      if (isAll) {
        const aggregated: WorkspaceReviewStats = (statsData || []).reduce(
          (acc, curr) => ({
            workspace_id: 'all',
            total_reviews:
              acc.total_reviews + (Number(curr.total_reviews) || 0),
            average_rating: 0,
            positive_count:
              acc.positive_count + (Number(curr.positive_count) || 0),
            neutral_count:
              acc.neutral_count + (Number(curr.neutral_count) || 0),
            negative_count:
              acc.negative_count + (Number(curr.negative_count) || 0),
            posted_replies_count:
              acc.posted_replies_count +
              (Number(curr.posted_replies_count) || 0),
          }),
          {
            workspace_id: 'all',
            total_reviews: 0,
            average_rating: 0,
            positive_count: 0,
            neutral_count: 0,
            negative_count: 0,
            posted_replies_count: 0,
          },
        )

        if (aggregated.total_reviews > 0) {
          const totalWeightedSum = (statsData || []).reduce(
            (sum, row) =>
              sum +
              (Number(row.average_rating) || 0) *
                (Number(row.total_reviews) || 0),
            0,
          )
          aggregated.average_rating = Number(
            (totalWeightedSum / aggregated.total_reviews).toFixed(2),
          )
        }

        setStats(aggregated)
      } else {
        setStats(statsData?.[0] || null)
      }

      // 3. Query rating distribution from reviews table
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .in('workspace_id', targetIds)

      if (reviewsError) throw reviewsError

      const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      reviewsData?.forEach((rev) => {
        if (rev.rating >= 1 && rev.rating <= 5) {
          counts[rev.rating] = (counts[rev.rating] || 0) + 1
        }
      })

      setRatingDistribution([
        { rating: 5, count: counts[5] },
        { rating: 4, count: counts[4] },
        { rating: 3, count: counts[3] },
        { rating: 2, count: counts[2] },
        { rating: 1, count: counts[1] },
      ])
    } catch (err) {
      console.error('Error fetching workspace stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics stats')
    } finally {
      setLoading(false)
    }
  }, [workspaceIdsKey, selectedWorkspaceId, supabase])

  // 4. Trigger fetch ONLY when workspaceIdsKey or selectedWorkspaceId actually changes
  useEffect(() => {
    void Promise.resolve().then(fetchStats)
  }, [fetchStats])

  return { stats, ratingDistribution, loading, error, refetch: fetchStats }
}
