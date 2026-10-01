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
} from 'lucide-react'

const itemIcon = {
  overview: Home,
  locations: MapPin,
  reviews: MessageCircleCode,
}

export default function AppSidebar({
  workspaceId,
  user,
}: {
  workspaceId: string
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
  ]
  return (
    <Sidebar
      collapsible="icon"
      className="group/sidebar top-16 h-[calc(100vh-4rem)]"
    >
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>

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
