import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AppSideBar from '@/components/navbar/Sidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

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
    <div className="flex min-h-0 flex-1 overflow-hidden bg-background">
      <SidebarProvider>
        <AppSideBar
          workspaceId={workspaceId}
          workspace={workspace}
          user={user}
        />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-8">
            <div className="mb-3 md:hidden">
              <SidebarTrigger aria-label="Open workspace navigation" />
            </div>
            {children}
          </main>
        </div>
      </SidebarProvider>
    </div>
  )
}
