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
