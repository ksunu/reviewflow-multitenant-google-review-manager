'use client'

import { redirect } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'

import {
  Home,
  User,
  Settings,
  ChevronRight,
  MapPin,
  MessageCircleCode,
  ArrowLeft,
  Building2,
  UserGroup,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

const itemIcon = {
  overview: Home,
  locations: MapPin,
  reviews: MessageCircleCode,
}

export default function AppSidebar({
  workspaceId,
  workspace,
  user,
}: {
  workspaceId: string
  workspace: any
  user: any
}) {
  const items = [
    {
      title: 'Overview',
      icon: Home,
      onClick: () => redirect(`/dashboard/${workspaceId}`),
    },
    {
      title: 'Locations',
      icon: MapPin,
      onClick: () => redirect(`/dashboard/${workspaceId}/locations`),
    },
    {
      title: 'Reviews',
      icon: MessageCircleCode,
      onClick: () => redirect(`/dashboard/${workspaceId}/reviews`),
    },
    {
      title: 'Team',
      icon: UserGroup,
      onClick: () => redirect(`/dashboard/${workspaceId}/team`),
    },
  ]
  return (
    <Sidebar
      collapsible="icon"
      className="group/sidebar top-16 h-[calc(100vh-4rem)]"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <div className="flex items-center gap-3">
              <Button asChild variant="ghost" size="icon" className="h-8 w-8">
                <Link href="/dashboard" title="All Workspaces">
                  <ArrowLeft className="w-4 h-4" />
                </Link>
              </Button>
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                <span className="font-semibold text-sm">
                  {workspace?.name || 'Workspace'}
                </span>
              </div>
            </div>
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    tooltip={item.title}
                    onClick={item.onClick}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="text-xs text-muted-foreground px-2 border-t pt-4">
          Logged in as{' '}
          <span className="font-medium text-foreground truncate block">
            {user.email}
          </span>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
