import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Building2,
  Plus,
  Star,
  MessageSquare,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
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

export default async function DashboardPage() {
  const supabase = await createClient()

  const user = await getCurrentUser()

  if (!user) redirect('/login')

  // 1. Fetch all workspaces the user belongs to
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

  // Extract workspaces list safely
  const workspaces = memberships?.map((m) => m.workspaces).filter(Boolean) || []
  const workspaceIds = workspaces.map((w) => w?.id).filter(Boolean) as string[]

  // 2. Fetch aggregate stats across all user workspaces (if any exist)
  let totalReviews = 0
  let averageRating = 0
  let totalLocations = 0

  if (workspaceIds.length > 0) {
    // Get locations count
    const { count: locCount } = await supabase
      .from('locations')
      .select('*', { count: 'exact', head: true })
      .in('workspace_id', workspaceIds)

    totalLocations = locCount || 0

    // Get reviews stats
    const { data: reviewsData } = await supabase
      .from('reviews')
      .select('rating')
      .in('workspace_id', workspaceIds)

    if (reviewsData && reviewsData.length > 0) {
      totalReviews = reviewsData.length
      const sum = reviewsData.reduce((acc, r) => acc + r.rating, 0)
      averageRating = Number((sum / totalReviews).toFixed(1))
    }
  }

  // 3. Empty State: If user has no workspaces yet
  if (workspaces.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center p-6 bg-background">
        <Card className="max-w-md w-full text-center p-6 border-dashed">
          <CardHeader>
            <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2 text-primary">
              <Building2 className="w-8 h-8" />
            </div>
            <CardTitle className="text-xl">Welcome to Review Manager</CardTitle>
            <CardDescription>
              You don&apos;t have any workspaces yet. Create your first
              workspace to start managing locations and customer reviews.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center pt-2">
            <Button asChild className="w-full">
              <Link href="/dashboard/new">
                <Plus className="w-4 h-4 mr-2" /> Create Workspace
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Command Center</h1>
          <p className="text-muted-foreground">
            Global overview across all your connected workspaces and locations.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/new">
            <Plus className="w-4 h-4 mr-2" /> New Workspace
          </Link>
        </Button>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReviews}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all workspaces
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Blended Rating
            </CardTitle>
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageRating || 'N/A'}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Overall average score
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">
              Active Locations
            </CardTitle>
            <Building2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLocations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Monitored business spots
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workspaces Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">
            Your Workspaces
          </h2>
          <span className="text-sm text-muted-foreground">
            {workspaces.length}{' '}
            {workspaces.length === 1 ? 'workspace' : 'workspaces'} total
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workspaces.map((workspace: any) => {
            if (!workspace) return null
            return (
              <Card
                key={workspace.id}
                className="hover:border-primary/50 transition-colors flex flex-col justify-between"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="bg-primary/10 text-primary p-2.5 rounded-lg">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground">
                      Active
                    </span>
                  </div>
                  <CardTitle className="text-lg mt-3">
                    {workspace.name}
                  </CardTitle>
                  <CardDescription className="font-mono text-xs truncate">
                    slug: {workspace.slug}
                  </CardDescription>
                </CardHeader>
                <CardFooter className="pt-2 border-t bg-muted/20">
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-between hover:bg-background"
                  >
                    <Link href={`/dashboard/${workspace.id}`}>
                      <span>View Workspace</span>
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
