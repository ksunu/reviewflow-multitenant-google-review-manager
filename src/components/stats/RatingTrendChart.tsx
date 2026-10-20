'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Loader2, TrendingUp, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface RatingTrendChartProps {
  workspaceIds: string[]
  selectedWorkspaceId: string
}

interface TrendDataPoint {
  date: string
  formattedDate: string
  averageRating: number
  reviewCount: number
}

export function RatingTrendChart({
  workspaceIds,
  selectedWorkspaceId,
}: RatingTrendChartProps) {
  const { t, i18n } = useTranslation()
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  const fetchTrendData = useCallback(async () => {
    if (!workspaceIds.length) {
      setTrendData([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)

      const isAll = selectedWorkspaceId === 'all'
      const targetIds = isAll ? workspaceIds : [selectedWorkspaceId]

      // Fetch reviews with rating and timestamp, ordered chronologically
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating, review_date')
        .in('workspace_id', targetIds)
        .order('review_date', { ascending: true })

      if (reviewsError) throw reviewsError

      if (!reviews || reviews.length === 0) {
        setTrendData([])
        setLoading(false)
        return
      }

      // Group reviews by YYYY-MM-DD date bucket
      const grouped: Record<string, { totalRating: number; count: number }> = {}

      reviews.forEach((rev) => {
        if (!rev.review_date) return
        const dateKey = rev.review_date.split('T')[0] // YYYY-MM-DD

        if (!grouped[dateKey]) {
          grouped[dateKey] = { totalRating: 0, count: 0 }
        }
        grouped[dateKey].totalRating += Number(rev.rating) || 0
        grouped[dateKey].count += 1
      })

      // Format into Recharts array
      const formatted: TrendDataPoint[] = Object.entries(grouped).map(
        ([date, stats]) => {
          const avg = stats.count > 0 ? stats.totalRating / stats.count : 0
          const dateObj = new Date(date)
          const formattedDate = isNaN(dateObj.getTime())
            ? date
            : dateObj.toLocaleDateString(i18n.language, {
                month: 'short',
                day: 'numeric',
              })

          return {
            date,
            formattedDate,
            averageRating: Number(avg.toFixed(2)),
            reviewCount: stats.count,
          }
        },
      )

      setTrendData(formatted)
    } catch (err) {
      console.error('Error fetching trend data:', err)
      console.error(err instanceof Error ? err.message : 'Failed to load trend analytics')
    } finally {
      setLoading(false)
    }
  }, [workspaceIds, selectedWorkspaceId, supabase, i18n.language])

  useEffect(() => {
    void Promise.resolve().then(fetchTrendData)
  }, [fetchTrendData])

  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm">
      {loading ? (
        <div className="flex h-[340px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-emerald-500/10 p-2 text-emerald-500">
                <TrendingUp className="h-4 w-4" />
              </div>
              <CardTitle className="text-base font-semibold tracking-tight">
                {t('charts.ratingTrend')}
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="h-[280px] pt-4">
            {trendData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {t('charts.noTrendData')}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trendData}
                  margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                >
                  <defs>
                    {/* Vibrant Dual Gradient Fill */}
                    <linearGradient
                      id="trendColorGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#10b981"
                        stopOpacity={0.45}
                      />
                      <stop
                        offset="50%"
                        stopColor="#84cc16"
                        stopOpacity={0.25}
                      />
                      <stop
                        offset="95%"
                        stopColor="#f59e0b"
                        stopOpacity={0.0}
                      />
                    </linearGradient>

                    {/* Glowing Stroke Filter */}
                    <filter
                      id="glow"
                      x="-20%"
                      y="-20%"
                      width="140%"
                      height="140%"
                    >
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite
                        in="SourceGraphic"
                        in2="blur"
                        operator="over"
                      />
                    </filter>
                  </defs>

                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border)"
                  />

                  <XAxis
                    dataKey="formattedDate"
                    stroke="var(--border)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--border)' }}
                    tick={{ fill: 'var(--muted-foreground)' }}
                    tickMargin={8}
                  />

                  {/* Golden Star Y Axis */}
                  <YAxis
                    domain={[1, 5]}
                    ticks={[1, 2, 3, 4, 5]}
                    stroke="var(--border)"
                    fontSize={12}
                    tickLine={false}
                    axisLine={{ stroke: 'var(--border)' }}
                    tickMargin={8}
                    tick={({ x, y, payload }) => (
                      <g transform={`translate(${x},${y})`}>
                        <text
                          x={-24}
                          y={4}
                          textAnchor="end"
                          fill="var(--foreground)"
                          fontSize={12}
                          fontWeight={600}
                        >
                          {payload.value}
                        </text>
                        <path
                          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                          transform="translate(-18, -8) scale(0.65)"
                          fill="#f59e0b"
                          stroke="#d97706"
                          strokeWidth="1"
                        />
                      </g>
                    )}
                  />

                  <Tooltip
                    cursor={{
                      stroke: '#10b981',
                      strokeWidth: 1.5,
                      strokeDasharray: '4 4',
                    }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const dataItem = payload[0].payload as TrendDataPoint
                        return (
                          <div className="rounded-xl border bg-popover/95 p-3 text-popover-foreground shadow-xl backdrop-blur-md">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              {dataItem.formattedDate}
                            </span>
                            <div className="mt-1 flex items-center gap-1.5 font-bold text-sm">
                              <span className="text-emerald-500">
                                {dataItem.averageRating}
                              </span>
                              <Star className="h-3.5 w-3.5 fill-amber-400 stroke-amber-500" />
                              <span className="text-xs font-normal text-muted-foreground ml-1">
                                ({dataItem.reviewCount}{' '}
                                {dataItem.reviewCount === 1
                                  ? t('charts.review')
                                  : t('charts.reviews')}
                                )
                              </span>
                            </div>
                          </div>
                        )
                      }
                      return null
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="averageRating"
                    stroke="#10b981"
                    strokeWidth={3}
                    filter="url(#glow)"
                    fillOpacity={1}
                    fill="url(#trendColorGradient)"
                    dot={{
                      r: 3,
                      fill: '#10b981',
                      stroke: 'var(--card)',
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 6,
                      fill: '#10b981',
                      stroke: '#ffffff',
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </>
      )}
    </Card>
  )
}
