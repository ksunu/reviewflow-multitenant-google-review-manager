import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import WorkspaceLocationsClient from './locations-client'

export default async function WorkspaceLocationsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>
}) {
  const { workspaceId } = await params
  const supabase = await createClient()

  // 1. Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2. Fetch workspace details
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('id', workspaceId)
    .single()

  // 3. Fetch user's role in this workspace
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  const workspaceRole = membership?.role || 'member'

  // 4. Fetch locations
  const { data: locations } = await supabase
    .from('locations')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })

  return (
    <WorkspaceLocationsClient
      workspaceId={workspaceId}
      initialWorkspace={workspace}
      initialLocations={locations || []}
      workspaceRole={workspaceRole}
    />
  )
}
