import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  Building2,
  LayoutDashboard,
  MapPin,
  MessageSquare,
  ArrowLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

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
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Workspace Sidebar */}
      <aside className="w-64 border-r bg-muted/20 p-4 hidden md:flex flex-col justify-between">
        <div className="space-y-6">
          {/* Top navigation / back link */}
          <div>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="mb-4 -ml-2 text-muted-foreground hover:text-foreground"
            >
              <Link href="/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" /> All Workspaces
              </Link>
            </Button>
            <div className="flex items-center gap-3 px-2 py-1.5 bg-primary/10 text-primary rounded-lg">
              <Building2 className="w-5 h-5 shrink-0" />
              <div className="truncate">
                <p className="font-semibold text-sm truncate">
                  {workspace?.name || 'Workspace'}
                </p>
                <p className="text-xs text-muted-foreground truncate font-mono">
                  {workspace?.slug}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link href={`/dashboard/${workspaceId}`}>
                <LayoutDashboard className="w-4 h-4 mr-2" /> Overview
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link href={`/dashboard/${workspaceId}/locations`}>
                <MapPin className="w-4 h-4 mr-2" /> Locations
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full justify-start">
              <Link href={`/dashboard/${workspaceId}/reviews`}>
                <MessageSquare className="w-4 h-4 mr-2" /> Reviews
              </Link>
            </Button>
          </nav>
        </div>

        {/* Footer Info */}
        <div className="text-xs text-muted-foreground px-2 border-t pt-4">
          Logged in as{' '}
          <span className="font-medium text-foreground truncate block">
            {user.email}
          </span>
        </div>
      </aside>

      {/* Main Workspace Content Area */}
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  )
}
