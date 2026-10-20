import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Building2, Plus, Star, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getCurrentUser } from '@/lib/supabase/user'
import WorkspaceFilter from './_components/workspace-filter'
import DashboardAnalytics from './_components/dashboard-analytics'
import { LocalizedText } from '@/components/i18n/LocalizedText'

export default async function DashboardPage() {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) redirect('/login')

  const { data: memberships, error: membershipError } = await supabase
    .from('workspace_members')
    .select(
      `
      workspace_id,
      role,
      workspaces (
        id,
        name,
        slug,
        created_at
      )
    `,
    )
    .eq('user_id', user.id)

  if (membershipError) {
    console.error('Error fetching memberships:', membershipError)
  }

  const workspaceMemberships =
    memberships?.flatMap((membership) => {
      const relatedWorkspaces = Array.isArray(membership.workspaces)
        ? membership.workspaces
        : membership.workspaces
          ? [membership.workspaces]
          : []

      return relatedWorkspaces
        .filter((workspace) => workspace && 'id' in workspace)
        .map((workspace) => ({ ...workspace, role: membership.role }))
    }) || []

  const workspaceIds = workspaceMemberships.map((w) => w.id)

  let totalReviews = 0
  let averageRating = 0
  let totalLocations = 0
  const locationCountsMap: Record<string, number> = {}

  if (workspaceIds.length > 0) {
    const { data: locationsData } = await supabase
      .from('locations')
      .select('id, workspace_id')
      .in('workspace_id', workspaceIds)

    if (locationsData) {
      totalLocations = locationsData.length
      locationsData.forEach((loc) => {
        locationCountsMap[loc.workspace_id] =
          (locationCountsMap[loc.workspace_id] || 0) + 1
      })
    }

    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('rating')
      .in('workspace_id', workspaceIds)

    if (reviewsData && reviewsData.length > 0) {
      totalReviews = reviewsData.length
      const sum = reviewsData.reduce((acc, r) => acc + (r.rating || 0), 0)
      averageRating = Number((sum / totalReviews).toFixed(1))
    }
  }

  if (workspaceMemberships.length === 0) {
    return (
      <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center bg-background">
        <Card className="max-w-md w-full text-center border-dashed">
          <CardHeader>
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2 text-primary">
              <Building2 className="w-8 h-8" />
            </div>
            <CardTitle className="text-xl"><LocalizedText i18nKey="dashboard.welcome" /></CardTitle>
            <CardDescription>
              <LocalizedText i18nKey="dashboard.emptyWorkspaces" />
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button asChild className="w-full">
              <Link href="/dashboard/new">
                <Plus className="w-4 h-4 mr-2" /> <LocalizedText i18nKey="dashboard.createWorkspace" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-background p-4 sm:p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight"><LocalizedText i18nKey="dashboard.commandCenter" /></h1>
          <p className="text-muted-foreground">
            <LocalizedText i18nKey="dashboard.globalOverview" />
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/new">
            <Plus className="w-4 h-4 mr-2" /> <LocalizedText i18nKey="dashboard.newWorkspace" />
          </Link>
        </Button>
      </div>
      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium"><LocalizedText i18nKey="dashboard.totalReviews" /></CardTitle>
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReviews}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <LocalizedText i18nKey="dashboard.acrossWorkspaces" />
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              <LocalizedText i18nKey="dashboard.blendedRating" />
            </CardTitle>
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageRating || 'N/A'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <LocalizedText i18nKey="dashboard.averageScore" />
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              <LocalizedText i18nKey="dashboard.activeLocations" />
            </CardTitle>
            <Building2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLocations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <LocalizedText i18nKey="dashboard.monitoredLocations" />
            </p>
          </CardContent>
        </Card>
      </div>
      {/* Workspaces Section with Search Filter & Carousel / Grid toggle */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          <LocalizedText i18nKey="dashboard.yourWorkspaces" />
        </h2>

        <WorkspaceFilter
          workspaces={workspaceMemberships}
          locationCountsMap={locationCountsMap}
        />
      </div>
      <DashboardAnalytics workspaces={workspaceMemberships} />
    </div>
  )
}
