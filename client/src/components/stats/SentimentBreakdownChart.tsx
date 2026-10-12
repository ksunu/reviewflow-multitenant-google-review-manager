'use client'

import { useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useWorkspaceStats } from '@/hooks/use-workspace-stats'
import { Loader2, Smile, Meh, Frown } from 'lucide-react'

export interface WorkspaceItem {
  id: string
  name: string
  slug?: string
}

interface SentimentBreakdownChartProps {
  workspaces: WorkspaceItem[]
}

// Sentiment Colors matching your design theme
const SENTIMENT_COLORS = {
  positive: '#10b981', // Emerald 500
  neutral: '#64748b', // Slate 500
  negative: '#f43f5e', // Rose 500
}

export function SentimentBreakdownChart({
  workspaces = [],
}: SentimentBreakdownChartProps) {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('all')

  const workspaceIds = workspaces.map((workspace) => workspace.id)

  const { stats, loading } = useWorkspaceStats(
    workspaceIds,
    selectedWorkspaceId,
  )

  // Map stats to Recharts pie format
  const positive = stats?.positive_count || 0
  const neutral = stats?.neutral_count || 0
  const negative = stats?.negative_count || 0
  const total = positive + neutral + negative

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
  ].filter((item) => item.value > 0) // Hide empty segments to keep the chart clean

  return (
    <Card className="border bg-card/50 backdrop-blur-sm">
      {loading ? (
        <div className="flex h-[340px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-semibold tracking-tight">
              Sentiment Analysis
            </CardTitle>
            <CardAction>
              <Select
                value={selectedWorkspaceId}
                onValueChange={setSelectedWorkspaceId}
              >
                <SelectTrigger className="w-[190px]">
                  <SelectValue placeholder="Select Workspace" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    All Workspaces ({workspaces.length})
                  </SelectItem>
                  {workspaces.map((workspace) => (
                    <SelectItem key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardAction>
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
                    paddingAngle={4}
                    stroke="none"
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
