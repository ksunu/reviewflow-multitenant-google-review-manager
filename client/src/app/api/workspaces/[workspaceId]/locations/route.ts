import { NextResponse } from 'next/server'
import { extractPrimaryBusinessType } from '@/lib/helpers/place-helpers'
import { getWorkspaceAuthorization } from '@/lib/supabase/authorization'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> },
) {
  try {
    const { workspaceId } = await params
    const { name, address, googleTypes } = await request.json()
    const access = await getWorkspaceAuthorization(workspaceId)
    if (!access.authorized) {
      return NextResponse.json(
        { error: access.status === 401 ? 'Unauthorized' : 'Forbidden' },
        { status: access.status },
      )
    }
    const { supabase } = access

    // Format the Google Places raw types array into a clean business type string
    // e.g., ['hair_care', 'beauty_salon'] becomes "Hair Care"
    const businessType = extractPrimaryBusinessType(googleTypes)

    // Insert the location with its clean business type
    const { data: newLocation, error } = await supabase
      .from('locations')
      .insert({
        workspace_id: workspaceId,
        name,
        address,
        business_type: businessType, // Stored directly per location
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, location: newLocation })
  } catch (err) {
    console.error('Location creation error:', err)
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Failed to save location',
      },
      { status: 500 },
    )
  }
}
