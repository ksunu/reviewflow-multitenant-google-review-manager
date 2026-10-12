'use server'

import { revalidatePath } from 'next/cache'
import { getWorkspaceAuthorization } from '@/lib/supabase/authorization'

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
  const access = await getWorkspaceAuthorization(data.workspaceId)
  if (!access.authorized) {
    return {
      success: false,
      error: access.status === 401 ? 'Unauthorized' : 'Forbidden',
    }
  }
  const { supabase } = access

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

export async function updateLocationAction(
  locationId: string,
  workspaceId: string,
  formData: { name: string; address?: string },
) {
  const access = await getWorkspaceAuthorization(workspaceId)
  if (!access.authorized) {
    return {
      success: false,
      error: access.status === 401 ? 'Unauthorized' : 'Forbidden',
    }
  }
  if (!['owner', 'admin'].includes(access.role)) {
    return { success: false, error: 'Forbidden: Insufficient permissions' }
  }
  const { supabase } = access

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
  const access = await getWorkspaceAuthorization(workspaceId)
  if (!access.authorized) {
    return {
      success: false,
      error: access.status === 401 ? 'Unauthorized' : 'Forbidden',
    }
  }
  if (!['owner', 'admin'].includes(access.role)) {
    return {
      success: false,
      error:
        'Permission denied. Only workspace owners or admins can delete locations.',
    }
  }
  const { supabase } = access

  // Delete associated reviews first
  const { error: reviewsError } = await supabase
    .from('reviews')
    .delete()
    .eq('location_id', locationId)
    .eq('workspace_id', workspaceId)
  if (reviewsError) return { success: false, error: reviewsError.message }

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
