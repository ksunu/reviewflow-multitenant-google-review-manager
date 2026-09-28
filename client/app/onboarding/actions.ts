'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function completeOnboarding(formData: FormData) {
  const supabase = await createClient()

  // 1. Get the currently logged-in user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect('/')
  }

  const businessName = (formData.get('businessName') as string) || 'My Business'

  // 2. Insert the new tenant workspace
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .insert({
      name: businessName,
      subscription_status: 'active',
    })
    .select()
    .single()

  if (tenantError || !tenant) {
    console.error('Error creating tenant:', tenantError?.message)
    return { error: 'Failed to create business workspace.' }
  }

  // 3. CRITICAL: Link the user to the new tenant in the tenant_users table!
  const { error: memberError } = await supabase.from('tenant_users').insert({
    tenant_id: tenant.id,
    user_id: user.id,
    role: 'owner', // or 'admin'
  })

  if (memberError) {
    console.error('Error linking user to tenant:', memberError.message)
    return { error: 'Failed to assign user to workspace.' }
  }

  // 4. Success! Redirect the user to the dashboard
  redirect('/dashboard')
}
