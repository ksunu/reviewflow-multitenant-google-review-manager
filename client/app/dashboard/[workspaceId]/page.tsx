'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Store,
  MapPin,
  Star,
  MessageSquare,
  Clock,
  CheckCircle2,
  ArrowRight,
  Loader2,
  TrendingUp,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function WorkspaceOverviewPage() {
  const params = useParams()
  const workspaceId = params.workspaceId as string
  const supabase = createClient()

  const [workspace, setWorkspace] = useState<any>(null)
  const [locations, setLocations] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadOverviewData() {
      try {
        // 1. Fetch workspace details
        const { data: ws } = await supabase
          .from('workspaces')
          .select('*')
          .eq('id', workspaceId)
          .single()

        setWorkspace(ws)

        // 2. Fetch locations for this workspace
        const { data: locs } = await supabase
          .from('locations')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false })

        setLocations(locs || [])

        // 3. Fetch recent reviews with joined location names
        const { data: revs } = await supabase
          .from('reviews')
          .select(
            `
            *,
            locations ( name )
          `,
          )
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false })
          .limit(5)

        setReviews(revs || [])
      } catch (err) {
        console.error('Error loading workspace overview:', err)
      } finally {
        setLoading(false)
      }
    }

    loadOverviewData()
  }, [workspaceId, supabase])

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Calculate overall metrics
  const totalLocations = locations.length
  const totalReviews = reviews.length
  const averageRating =
    totalReviews > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(
          1,
        )
      : '0.0'
  const pendingReviewsCount = reviews.filter(
    (r) => r.status === 'pending',
  ).length

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Overview Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-muted/20 p-6 rounded-2xl border">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground uppercase tracking-wider">
            <Building2 className="w-4 h-4 text-primary" /> Workspace Command
            Center
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {workspace?.name || 'Workspace Overview'}
          </h1>
          <p className="text-muted-foreground text-sm">
            Monitor locations performance, aggregate ratings, and track pending
            customer responses.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <Link href={`/dashboard/${workspaceId}/locations`}>
              Manage Locations
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/dashboard/${workspaceId}/reviews`}>
              View All Reviews
            </Link>
          </Button>
        </div>
      </div>

      {/* High-Level Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Store Locations
            </CardTitle>
            <Store className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLocations}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Active business branches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall Rating
            </CardTitle>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {averageRating}{' '}
              <span className="text-xs font-normal text-muted-foreground">
                / 5.0
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on recent feedback
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Reviews Synced
            </CardTitle>
            <MessageSquare className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalReviews}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across all branches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Action
            </CardTitle>
            <Clock className="w-4 h-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {pendingReviewsCount}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Reviews awaiting response
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two-Column Section: Locations Snapshot & Recent Reviews */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Locations Snapshot (1 col) */}
        <Card className="lg:col-span-1 flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> Locations List
              </CardTitle>
              <Link
                href={`/dashboard/${workspaceId}/locations`}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <CardDescription className="text-xs">
              Quick view of registered store addresses.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {locations.length === 0 ? (
              <p className="text-xs text-muted-foreground py-6 text-center">
                No locations added yet.
              </p>
            ) : (
              locations.slice(0, 4).map((loc) => (
                <div
                  key={loc.id}
                  className="p-3 rounded-lg border bg-muted/10 space-y-1"
                >
                  <div className="font-semibold text-sm truncate">
                    {loc.name}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {loc.address || 'No address specified'}
                  </div>
                </div>
              ))
            )}
          </CardContent>
          <CardFooter className="pt-2 border-t bg-muted/10">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="w-full text-xs"
            >
              <Link href={`/dashboard/${workspaceId}/locations`}>
                Manage Locations
              </Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Right Column: Latest Reviews Feed (2 cols) */}
        <Card className="lg:col-span-2 flex flex-col justify-between">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" /> Recent
                Customer Feedback
              </CardTitle>
              <Link
                href={`/dashboard/${workspaceId}/reviews`}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
              >
                Go to feed <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <CardDescription className="text-xs">
              Latest ratings and comments submitted across store locations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reviews.length === 0 ? (
              <p className="text-xs text-muted-foreground py-10 text-center">
                No reviews recorded yet.
              </p>
            ) : (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="p-3.5 rounded-lg border bg-card hover:border-primary/40 transition-colors space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">
                        {review.author_name}
                      </span>
                      <span className="text-[11px] bg-muted px-2 py-0.5 rounded text-muted-foreground">
                        {review.locations?.name || 'Store'}
                      </span>
                    </div>
                    <div className="flex items-center text-amber-500 gap-0.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-current' : 'text-muted stroke-current'}`}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-foreground/80 line-clamp-2">
                    &ldquo;{review.comment || 'No comment provided.'}&rdquo;
                  </p>
                </div>
              ))
            )}
          </CardContent>
          <CardFooter className="pt-2 border-t bg-muted/10">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="w-full text-xs"
            >
              <Link href={`/dashboard/${workspaceId}/reviews`}>
                Open Full Review Feed & AI Generator
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
