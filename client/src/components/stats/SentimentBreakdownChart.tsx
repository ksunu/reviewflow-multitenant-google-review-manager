'use client'

import { useEffect, useMemo, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Smile, Meh, Frown, CircleHelp } from 'lucide-react'

interface SentimentBreakdownChartProps {
  workspaceIds: string[]
  selectedWorkspaceId: string
}

// Sentiment Colors matching your design theme
const SENTIMENT_COLORS = {
  positive: '#10b981', // Emerald 500
  neutral: '#64748b', // Slate 500
  negative: '#f43f5e', // Rose 500
}

const SENTIMENTS = ['positive', 'neutral', 'negative'] as const
type Sentiment = (typeof SENTIMENTS)[number]
type SentimentCounts = Record<Sentiment, number> & { unanalyzed: number }

const EMPTY_COUNTS: SentimentCounts = {
  positive: 0,
  neutral: 0,
  negative: 0,
  unanalyzed: 0,
}

export function SentimentBreakdownChart({
  workspaceIds,
  selectedWorkspaceId,
}: SentimentBreakdownChartProps) {
  const [counts, setCounts] = useState<SentimentCounts>(EMPTY_COUNTS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = useMemo(() => createClient(), [])
  const hasTargetWorkspace =
    selectedWorkspaceId === 'all'
      ? workspaceIds.length > 0
      : workspaceIds.includes(selectedWorkspaceId)

  useEffect(() => {
    let cancelled = false
    const targetIds =
      selectedWorkspaceId === 'all'
        ? workspaceIds
        : workspaceIds.includes(selectedWorkspaceId)
          ? [selectedWorkspaceId]
          : []

    if (targetIds.length === 0) {
      return () => {
        cancelled = true
      }
    }

    async function loadSentimentCounts() {
      try {
        const results = await Promise.all([
          ...SENTIMENTS.map((sentiment) =>
            supabase
              .from('reviews')
              .select('id', { count: 'exact', head: true })
              .in('workspace_id', targetIds)
              .eq('sentiment', sentiment),
          ),
          supabase
            .from('reviews')
            .select('id', { count: 'exact', head: true })
            .in('workspace_id', targetIds)
            .is('sentiment', null),
        ])

        const failedResult = results.find((result) => result.error)
        if (failedResult?.error) throw failedResult.error

        if (!cancelled) {
          setCounts({
            positive: results[0].count ?? 0,
            neutral: results[1].count ?? 0,
            negative: results[2].count ?? 0,
            unanalyzed: results[3].count ?? 0,
          })
        }
      } catch (err) {
        console.error('Error fetching sentiment counts:', err)
        if (!cancelled) {
          setCounts(EMPTY_COUNTS)
          setError('Could not load sentiment data.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void Promise.resolve().then(() => {
      if (cancelled) return
      setLoading(true)
      setError(null)
      void loadSentimentCounts()
    })

    return () => {
      cancelled = true
    }
  }, [workspaceIds, selectedWorkspaceId, supabase])

  const visibleCounts = hasTargetWorkspace ? counts : EMPTY_COUNTS
  const visibleLoading = hasTargetWorkspace && loading
  const visibleError = hasTargetWorkspace ? error : null
  const positive = visibleCounts.positive
  const neutral = visibleCounts.neutral
  const negative = visibleCounts.negative
  const unanalyzed = visibleCounts.unanalyzed
  const total = hasTargetWorkspace
    ? positive + neutral + negative + unanalyzed
    : 0

  const chartData = [
    {
      name: 'Positive',
      value: positive,
      color: SENTIMENT_COLORS.positive,
      icon: Smile,
    },
    {
      name: 'Neutral',
      value: neutral,
      color: SENTIMENT_COLORS.neutral,
      icon: Meh,
    },
    {
      name: 'Negative',
      value: negative,
      color: SENTIMENT_COLORS.negative,
      icon: Frown,
    },
    {
      name: 'Not analyzed',
      value: unanalyzed,
      color: '#94a3b8',
      icon: CircleHelp,
    },
  ].filter((item) => item.value > 0) // Hide empty segments to keep the chart clean

  return (
    <Card className="overflow-hidden border-border bg-card shadow-sm">
      {visibleLoading ? (
        <div className="flex h-[340px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : visibleError ? (
        <div className="flex h-[340px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
          {visibleError}
        </div>
      ) : (
        <>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold tracking-tight">
              Sentiment Analysis
            </CardTitle>
          </CardHeader>

          <CardContent className="h-[280px] pt-2 flex items-center justify-between">
            {/* Donut Chart */}
            <div className="relative h-full w-[55%]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={3}
                    stroke="var(--card)"
                    strokeWidth={3}
                  >
                    {chartData.map((entry) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={entry.color}
                        className="transition-all duration-300 hover:opacity-80 cursor-pointer"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const dataItem = payload[0].payload
                        const percentage =
                          total > 0
                            ? ((dataItem.value / total) * 100).toFixed(1)
                            : 0

                        return (
                          <div className="rounded-xl border bg-popover/95 p-3 text-popover-foreground shadow-lg backdrop-blur-md">
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full"
                                style={{ backgroundColor: dataItem.color }}
                              />
                              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {dataItem.name} Sentiment
                              </span>
                            </div>
                            <p className="mt-1 text-sm font-bold">
                              {dataItem.value}{' '}
                              <span className="font-normal text-muted-foreground">
                                ({percentage}%)
                              </span>
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Center Donut Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  Total
                </span>
                <span className="text-xl font-bold tracking-tight">
                  {total}
                </span>
              </div>
            </div>

            {/* Custom Legend */}
            <div className="w-[40%] flex flex-col justify-center gap-3 pr-2">
              {[
                {
                  label: 'Positive',
                  count: positive,
                  color: SENTIMENT_COLORS.positive,
                  Icon: Smile,
                },
                {
                  label: 'Neutral',
                  count: neutral,
                  color: SENTIMENT_COLORS.neutral,
                  Icon: Meh,
                },
                {
                  label: 'Negative',
                  count: negative,
                  color: SENTIMENT_COLORS.negative,
                  Icon: Frown,
                },
                {
                  label: 'Not analyzed',
                  count: unanalyzed,
                  color: '#94a3b8',
                  Icon: CircleHelp,
                },
              ].map(({ label, count, color, Icon }) => {
                const pct = total > 0 ? Math.round((count / total) * 100) : 0
                return (
                  <div
                    key={label}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        {label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="font-bold text-foreground">{count}</span>
                      <span>({pct}%)</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </>
      )}
    </Card>
  )
}
