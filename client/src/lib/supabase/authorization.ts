import { createClient } from '@/lib/supabase/server'

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>

/**
 * Verify the caller's session and their membership in a workspace.
 * Server Actions and Route Handlers must call this independently of page/layout
 * checks because they can be invoked directly.
 */
export async function getWorkspaceAuthorization(
  workspaceId: string,
  client?: SupabaseServerClient,
) {
  const supabase = client ?? (await createClient())
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { authorized: false as const, status: 401 as const }
  }

  const { data: membership, error: membershipError } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (membershipError || !membership) {
    return { authorized: false as const, status: 403 as const }
  }

  return {
    authorized: true as const,
    supabase,
    user,
    role: membership.role,
  }
}
