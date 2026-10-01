import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  Building2,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  ArrowLeft,
  Home,
  User,
  Settings,
  ChevronRight,
  MessageCircleCode,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

import AppSideBar from '@/components/navbar/Sidebar'
import { SidebarProvider } from '@/components/ui/sidebar'

interface WorkspaceLayoutProps {
  children: React.ReactNode
  params: Promise<{ workspaceId: string }>
}

export default async function WorkspaceLayout({
  children,
  params,
}: WorkspaceLayoutProps) {
  const { workspaceId } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. Verify membership using your security definer helper function
  const { data: isMember } = await supabase.rpc('user_belongs_to_workspace', {
    p_workspace_id: workspaceId,
  })

  if (!isMember) {
    redirect('/dashboard')
  }

  // 2. Fetch current workspace details
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single()

  return (
    <div className="flex bg-background overflow-hidden">
      <SidebarProvider>
        <AppSideBar
          workspaceId={workspaceId}
          workspace={workspace}
          user={user}
        />
        {/* Main Workspace Content Area */}
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </SidebarProvider>
    </div>
  )
}
