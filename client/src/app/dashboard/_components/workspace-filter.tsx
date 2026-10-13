'use client'

import { useState } from 'react'
import { Search, Building2, MapPin, ArrowRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import WorkspaceCardActions from './workspace-card-actions'
import Link from 'next/link'

interface WorkspaceFilterProps {
  workspaces: any[]
  locationCountsMap: Record<string, number>
}

export default function WorkspaceFilter({
  workspaces,
  locationCountsMap,
}: WorkspaceFilterProps) {
  const [searchQuery, setSearchQuery] = useState('')
  console.log(workspaces)
  // Filter workspaces based on input query (case-insensitive)
  const filteredWorkspaces = workspaces.filter((workspace) =>
    workspace.name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const renderWorkspaceCard = (workspace: any) => {
    const locationCount = locationCountsMap[workspace.id] || 0
    const canManage = workspace.role === 'owner' || workspace.role === 'admin'

    return (
      <Card
        key={workspace.id}
        className="flex h-full flex-col justify-between border border-border ring-0 transition-colors hover:border-primary/50"
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="bg-primary/10 text-primary p-2.5 rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono bg-muted px-2 py-1 rounded text-muted-foreground capitalize">
              {workspace.role}
            </span>
          </div>
          <CardTitle className="text-lg mt-3 truncate">
            {workspace.name}
          </CardTitle>
          <CardDescription className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>
              {locationCount} {locationCount === 1 ? 'Location' : 'Locations'}
            </span>
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0 pb-2">
          <WorkspaceCardActions
            workspaceId={workspace.id}
            workspaceName={workspace.name}
            canManage={canManage}
          />
        </CardContent>

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
  }

  return (
    <div className="space-y-6">
      {/* Search Input Bar */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search workspaces..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          Showing {filteredWorkspaces.length} of {workspaces.length} workspaces
        </span>
      </div>
      {/* Render Filtered List */}
      {filteredWorkspaces.length === 0 ? (
        <div className="text-center py-12 border rounded-xl border-dashed">
          <p className="text-muted-foreground text-sm">
            No workspaces found matching &quot;{searchQuery}&quot;
          </p>
        </div>
      ) : filteredWorkspaces.length <= 3 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkspaces.map((workspace) =>
            renderWorkspaceCard(workspace),
          )}
        </div>
      ) : (
        /* Added relative positioning and padding gutter for arrows without hiding them */
        <div className="w-full relative px-8 md:px-4">
          <Carousel
            opts={{
              align: 'start',
              loop: false,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-4">
              {filteredWorkspaces.map((workspace) => (
                <CarouselItem
                  key={workspace.id}
                  className="pl-4 md:basis-1/2 lg:basis-1/3 py-2"
                >
                  {renderWorkspaceCard(workspace)}
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-2 md:-left-4 h-8 w-8 cursor-pointer" />
            <CarouselNext className="-right-2 md:-right-4 h-8 w-8 cursor-pointer" />
          </Carousel>
        </div>
      )}{' '}
    </div>
  )
}
