'use server'

import { createClient } from '@/lib/supabase/server' // Adjust import based on your project structure
import { revalidatePath } from 'next/cache'

interface AddLocationInput {
  workspaceId: string
  name: string
  placeId: string
  businessType: string
  address: string
  latitude: number
  longitude: number
}

export async function addLocationAction(data: AddLocationInput) {
  const supabase = await createClient()

  // 1. Verify user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Unauthorized. Please log in.' }
  }

  // 2. Insert location (RLS will automatically verify if user belongs to workspace_id)
  const { error: insertError } = await supabase.from('locations').insert({
    workspace_id: data.workspaceId,
    name: data.name,
    google_place_id: data.placeId,
    business_type: data.businessType,
    address: data.address,
    latitude: data.latitude,
    longitude: data.longitude,
  })

  if (insertError) {
    console.error('Failed to insert location:', insertError.message)
    return { success: false, error: insertError.message }
  }

  // 3. Revalidate dashboard cache so the new location appears immediately
  revalidatePath('/dashboard')

  return { success: true }
}

// Helper to check if current user is owner/admin of the workspace
async function verifyWorkspaceAccess(
  supabase: any,
  userId: string,
  workspaceId: string,
) {
  const { data: member, error } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single()

  if (error || !member) return false
  return ['owner', 'admin'].includes(member.role)
}

export async function updateLocationAction(
  locationId: string,
  workspaceId: string,
  formData: { name: string; address?: string },
) {
  const supabase = await createClient()

  // 1. Verify user authentication & workspace permissions
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const { data: membership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspaceId)
    .eq('user_id', user.id)
    .single()

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return { success: false, error: 'Forbidden: Insufficient permissions' }
  }

  // 2. Update location in database
  const { error } = await supabase
    .from('locations')
    .update({
      name: formData.name,
      address: formData.address,
      updated_at: new Date().toISOString(),
    })
    .eq('id', locationId)
    .eq('workspace_id', workspaceId)

  if (error) {
    return { success: false, error: error.message }
  }

  // 3. Revalidate path to update UI cache
  revalidatePath(`/dashboard/${workspaceId}/locations`)
  return { success: true }
}

export async function deleteLocationAction(
  locationId: string,
  workspaceId: string,
) {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Unauthorized. Please log in.' }
  }

  // Verify user has owner or admin permission in this workspace
  const hasAccess = await verifyWorkspaceAccess(supabase, user.id, workspaceId)
  if (!hasAccess) {
    return {
      success: false,
      error:
        'Permission denied. Only workspace owners or admins can delete locations.',
    }
  }

  // Delete associated reviews first
  await supabase.from('reviews').delete().eq('location_id', locationId)

  // Delete the location
  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', locationId)
    .eq('workspace_id', workspaceId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}
