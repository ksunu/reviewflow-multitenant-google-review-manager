'use client'

import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
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
import { Loader2, Star } from 'lucide-react'

export interface WorkspaceItem {
  id: string
  name: string
  slug?: string
}

export interface RatingDistributionChartProps {
  workspaces: WorkspaceItem[]
}

interface RatingDistributionItem {
  rating: number
  count: number
}

// 5-Star (Positive/Emerald) -> 1-Star (Negative/Red) Degradation Colors
const STAR_COLORS: Record<number, string> = {
  5: '#10b981', // Emerald 500
  4: '#84cc16', // Lime 500
  3: '#eab308', // Amber 500
  2: '#f97316', // Orange 500
  1: '#f43f5e', // Rose 500
}

export function RatingDistributionChart({
  workspaces = [],
}: RatingDistributionChartProps) {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('all')

  const workspaceIds = workspaces.map((workspace) => workspace.id)

  const { ratingDistribution, loading } = useWorkspaceStats(
    workspaceIds,
    selectedWorkspaceId,
  )

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
              Rating Distribution
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

          <CardContent className="h-[280px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ratingDistribution}
                layout="vertical"
                margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
              >
                {/* Background Grid Lines */}
                <CartesianGrid
                  horizontal={false}
                  stroke="hsl(var(--border) / 0.5)"
                  strokeDasharray="3 3"
                />

                {/* X Axis */}
                <XAxis
                  type="number"
                  stroke="hsl(var(--muted-foreground) / 0.6)"
                  fontSize={12}
                  tickLine={true}
                  axisLine={true}
                  allowDecimals={false}
                />

                {/* Y Axis with Custom Star Icon Formatting */}
                <YAxis
                  type="category"
                  dataKey="rating"
                  stroke="hsl(var(--muted-foreground) / 0.8)"
                  fontSize={13}
                  tickLine={false}
                  axisLine={true}
                  tick={({ x, y, payload }) => (
                    <g transform={`translate(${x},${y})`}>
                      <text
                        x={-24}
                        y={4}
                        textAnchor="end"
                        fill="currentColor"
                        className="text-xs font-semibold fill-foreground"
                      >
                        {payload.value}
                      </text>
                      {/* Golden Yellow Star */}
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

                {/* Tooltip */}
                <Tooltip
                  cursor={{ fill: 'hsl(var(--muted) / 0.25)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const dataItem = payload[0]
                        .payload as RatingDistributionItem
                      const starColor =
                        STAR_COLORS[dataItem.rating] || '#10b981'

                      return (
                        <div className="rounded-xl border bg-popover/95 p-3 text-popover-foreground shadow-lg backdrop-blur-md">
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: starColor }}
                            />
                            <span className="flex items-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                              {dataItem.rating} Star Rating
                              <Star className="ml-1 h-3.5 w-3.5 fill-amber-400 stroke-amber-500" />
                            </span>
                          </div>
                          <p className="mt-1 text-sm font-bold">
                            {dataItem.count}{' '}
                            <span className="font-normal text-muted-foreground">
                              {dataItem.count === 1 ? 'review' : 'reviews'}
                            </span>
                          </p>
                        </div>
                      )
                    }
                    return null
                  }}
                />

                {/* Bar with Individual Gradient Degradation Cells */}
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={18}>
                  {ratingDistribution.map((entry) => (
                    <Cell
                      key={`cell-${entry.rating}`}
                      fill={STAR_COLORS[entry.rating] || 'hsl(var(--primary))'}
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </>
      )}
    </Card>
  )
}
