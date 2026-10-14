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
  Settings,
  MapPin,
  MessageCircleCode,
  ArrowLeft,
  Building2,
  Users,
  Sliders,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { User } from '@supabase/supabase-js'
import type { Workspace } from '@/types/models'

export default function AppSidebar({
  workspaceId,
  workspace,
  user,
}: {
  workspaceId: string
  workspace: Pick<Workspace, 'id' | 'name'>
  user: Pick<User, 'email'> | null
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
      icon: Users,
      onClick: () => redirect(`/dashboard/${workspaceId}/team`),
    },
  ]

  return (
    <Sidebar
      collapsible="icon"
      className="group/sidebar top-16 h-[calc(100dvh-4rem)] border-r"
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
              <div className="flex items-center gap-2 truncate">
                <Building2 className="w-4 h-4 text-primary shrink-0" />
                <span className="font-semibold text-sm truncate">
                  {workspace?.name || 'Workspace'}
                </span>
              </div>
            </div>
          </SidebarGroupLabel>

          <SidebarGroupContent className="mt-2">
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

      {/* Footer using DropdownMenu without nested button conflicts */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    className="h-12 w-full justify-start overflow-hidden rounded-md p-2 text-left text-sm hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground group-has-[[data-sidebar=menu-action]]/menu-item:pr-8 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Sliders className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex flex-col text-left truncate leading-tight group-data-[collapsible=icon]:hidden">
                      <span className="font-medium text-xs text-foreground truncate">
                        {user?.email || 'User Account'}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        Configure
                      </span>
                    </div>
                  </Button>
                }
              />

              <DropdownMenuContent
                side="right"
                align="end"
                className="w-56 rounded-xl shadow-lg"
              >
                <div className="px-3 py-2 text-xs font-semibold text-muted-foreground border-b mb-1 truncate">
                  {user?.email}
                </div>
                <DropdownMenuItem
                  onClick={() => redirect(`/dashboard/${workspaceId}/settings`)}
                  className="cursor-pointer gap-2"
                >
                  <Settings className="w-4 h-4 text-muted-foreground" />
                  <span>Workspace Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => redirect('/auth/signout')}
                  className="cursor-pointer gap-2 text-rose-500 focus:text-rose-500"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
