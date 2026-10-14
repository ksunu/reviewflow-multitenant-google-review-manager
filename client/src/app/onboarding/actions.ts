'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export interface OnboardingState {
  error: string | null
}

export async function completeOnboarding(
  _previousState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) redirect('/')

  const businessName = formData.get('businessName')
  const locationName = formData.get('locationName')

  if (
    typeof businessName !== 'string' ||
    typeof locationName !== 'string' ||
    !businessName.trim() ||
    !locationName.trim()
  ) {
    return { error: 'Enter a workspace name and an initial location name.' }
  }

  const name = businessName.trim()
  const slug = name
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
  if (!slug) {
    return { error: 'The workspace name must include a letter or number.' }
  }

  const { data, error } = await supabase
    .rpc('create_workspace_with_location', {
      p_name: name,
      p_slug: slug,
      p_location_name: locationName.trim(),
    })
    .single()

  if (
    error ||
    !data ||
    typeof data !== 'object' ||
    !('id' in data) ||
    typeof data.id !== 'string'
  ) {
    console.error('Failed to complete workspace onboarding:', error?.message)
    return { error: 'Failed to create your workspace. Please try again.' }
  }

  redirect(`/dashboard/${data.id}`)
}
