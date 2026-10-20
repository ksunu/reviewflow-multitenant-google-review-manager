'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  MessageSquare,
  Star,
  Clock,
  CheckCircle2,
  TrendingUp,
  Store,
  Loader2,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useTranslation } from 'react-i18next'

export default function WorkspaceOverviewPage() {
  const { t } = useTranslation()
  const params = useParams()
  const searchParams = useSearchParams()
  const workspaceId = params.workspaceId as string
  const locationId = searchParams.get('locationId')
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 0,
    pendingReviews: 0,
    resolvedReviews: 0,
    ratingCounts: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>,
    totalLocations: 0,
    selectedLocationName: '',
  })

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true)

        // 1. Fetch total locations count for the workspace
        const { count: locCount } = await supabase
          .from('locations')
          .select('*', { count: 'exact', head: true })
          .eq('workspace_id', workspaceId)

        // 2. If a specific location is selected, fetch its name for context
        let locationName = ''
        if (locationId && locationId !== 'all') {
          const { data: locData } = await supabase
            .from('locations')
            .select('name')
            .eq('id', locationId)
            .eq('workspace_id', workspaceId)
            .single()
          if (locData) locationName = locData.name
        }

        // 3. Build reviews query with optional location filter
        let reviewQuery = supabase
          .from('reviews')
          .select('rating, status')
          .eq('workspace_id', workspaceId)

        if (locationId && locationId !== 'all') {
          reviewQuery = reviewQuery.eq('location_id', locationId)
        }

        const { data: reviews, error } = await reviewQuery

        if (error) throw error

        const list = reviews || []
        const totalReviews = list.length
        const pendingReviews = list.filter((r) => r.status === 'pending').length
        const resolvedReviews = list.filter(
          (r) => r.status === 'resolved' || r.status === 'replied',
        ).length

        let ratingSum = 0
        const ratingCounts: Record<number, number> = {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        }

        list.forEach((r) => {
          ratingSum += r.rating || 0
          if (ratingCounts[r.rating] !== undefined) {
            ratingCounts[r.rating]++
          }
        })

        const averageRating =
          totalReviews > 0 ? (ratingSum / totalReviews).toFixed(1) : '0.0'

        setStats({
          totalReviews,
          averageRating: Number(averageRating),
          pendingReviews,
          resolvedReviews,
          ratingCounts,
          totalLocations: locCount || 0,
          selectedLocationName: locationName,
        })
      } catch (err) {
        console.error('Error loading analytics:', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [workspaceId, locationId, supabase])

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const isAllLocations = !locationId || locationId === 'all'

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t('dashboard.overview')}
        </h1>
        <p className="text-muted-foreground text-sm">
          {isAllLocations
            ? t('dashboard.overviewDescription')
            : t('dashboard.selectedLocation', { location: stats.selectedLocationName || t('common.location') })}
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.totalReviews')}
            </CardTitle>
            <MessageSquare className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReviews}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {isAllLocations
                ? t('dashboard.acrossChannels')
                : t('dashboard.forSelectedStore')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.averageRating')}
            </CardTitle>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {stats.averageRating}{' '}
              <span className="text-xs font-normal text-muted-foreground">
                / 5.0
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.customerSentiment')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.pendingAction')}
            </CardTitle>
            <Clock className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-300">
              {stats.pendingReviews}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.requiresReview')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.managedLocations')}
            </CardTitle>
            <Store className="w-4 h-4 text-sky-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLocations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {t('dashboard.activeStorefronts')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Rating Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> {t('dashboard.ratingDistribution')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.ratingDistributionDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = stats.ratingCounts[star] || 0
              const percentage =
                stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0
              return (
                <div key={star} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium">
                    <span className="flex items-center gap-1">
                      {star}{' '}
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    </span>
                    <span className="text-muted-foreground">
                      {count} reviews ({percentage.toFixed(0)}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Response
              {t('dashboard.responseHealth')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.responseHealthDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col justify-center h-[260px] space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-emerald-400">
                  {t('dashboard.resolved')}
                </span>
                <span className="font-bold">{stats.resolvedReviews}</span>
              </div>
              <Progress
                value={
                  stats.totalReviews > 0
                    ? (stats.resolvedReviews / stats.totalReviews) * 100
                    : 0
                }
                className="h-3 bg-emerald-500/15"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-orange-300">
                  {t('dashboard.pendingReview')}
                </span>
                <span className="font-bold">{stats.pendingReviews}</span>
              </div>
              <Progress
                value={
                  stats.totalReviews > 0
                    ? (stats.pendingReviews / stats.totalReviews) * 100
                    : 0
                }
                className="h-3 bg-orange-500/15"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
