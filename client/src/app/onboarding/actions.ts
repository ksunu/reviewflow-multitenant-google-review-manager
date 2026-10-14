'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/user'

export interface OnboardingState {
  error?: string
}

export async function completeOnboarding(
  _previousState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) redirect('/')

  const businessName = formData.get('businessName')
  const locationName = formData.get('locationName')

  if (typeof businessName !== 'string' || !businessName.trim()) {
    return { error: 'Enter a business or brand name.' }
  }

  if (typeof locationName !== 'string' || !locationName.trim()) {
    return { error: 'Enter the name of your first location.' }
  }

  const cleanBusinessName = businessName.trim()
  const cleanLocationName = locationName.trim()
  if (cleanBusinessName.length > 120 || cleanLocationName.length > 120) {
    return { error: 'Names must be 120 characters or fewer.' }
  }

  const slugBase = cleanBusinessName
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  const slug = `${slugBase || 'workspace'}-${crypto.randomUUID().slice(0, 8)}`

  let rpcError: { message: string } | null
  try {
    const { error } = await supabase.rpc('create_workspace_with_location', {
      p_name: cleanBusinessName,
      p_slug: slug,
      p_location_name: cleanLocationName,
    })
    rpcError = error
  } catch (error) {
    console.error('Error completing workspace onboarding:', error)
    return {
      error: 'Could not create your workspace. Please try again.',
    }
  }

  if (rpcError) {
    console.error('Error completing workspace onboarding:', rpcError.message)
    return {
      error: 'Could not create your workspace. Please try again.',
    }
  }

  redirect('/dashboard')
}
