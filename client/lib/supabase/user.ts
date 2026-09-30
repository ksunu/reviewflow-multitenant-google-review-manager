import { cache } from 'react'
import { createClient } from './server' // path to your standard server client

export const getCurrentUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) return null

  return user
})
