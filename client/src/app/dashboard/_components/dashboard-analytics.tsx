'use client'

import { useMemo, useState } from 'react'
import { RatingDistributionChart } from '@/components/stats/RatingDistributionChart'
import { SentimentBreakdownChart } from '@/components/stats/SentimentBreakdownChart'
import { RatingTrendChart } from '@/components/stats/RatingTrendChart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface DashboardWorkspace {
  id: string
  name: string
}

export default function DashboardAnalytics({
  workspaces,
}: {
  workspaces: DashboardWorkspace[]
}) {
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('all')
  const workspaceIds = useMemo(
    () => workspaces.map((workspace) => workspace.id),
    [workspaces],
  )
  const selectedWorkspaceName = workspaces.find(
    (workspace) => workspace.id === selectedWorkspaceId,
  )?.name

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">
            Analytics Overview
          </h2>
          <p className="text-sm text-muted-foreground">
            Review ratings and sentiment across your workspaces.
          </p>
        </div>

        <div className="w-full sm:w-auto">
          <label
            htmlFor="analytics-workspace"
            className="mb-1.5 block text-xs font-medium text-muted-foreground"
          >
            Workspace
          </label>
          <Select
            value={selectedWorkspaceId}
            onValueChange={(value) => value && setSelectedWorkspaceId(value)}
          >
            <SelectTrigger id="analytics-workspace" className="w-full sm:w-64">
              <SelectValue>
                {selectedWorkspaceId === 'all'
                  ? `All Workspaces (${workspaces.length})`
                  : selectedWorkspaceName || 'Select Workspace'}
              </SelectValue>
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
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <div className="lg:col-span-3">
          <RatingDistributionChart
            workspaceIds={workspaceIds}
            selectedWorkspaceId={selectedWorkspaceId}
          />
        </div>
        <div className="lg:col-span-4">
          <SentimentBreakdownChart
            workspaceIds={workspaceIds}
            selectedWorkspaceId={selectedWorkspaceId}
          />
        </div>
        <div className="lg:col-span-7">
          <RatingTrendChart
            workspaceIds={workspaceIds}
            selectedWorkspaceId={selectedWorkspaceId}
          />
        </div>
      </div>
    </section>
  )
}
