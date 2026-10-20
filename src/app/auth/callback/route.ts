import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.session) {
      // Extract provider token (Google access token & refresh token)
      const providerToken = data.session.provider_token
      const providerRefreshToken = data.session.provider_refresh_token
      const user = data.session.user

      if (providerToken && user) {
        // Save or update tokens in our user_integrations table
        await supabase.from('user_integrations').upsert(
          {
            user_id: user.id,
            provider: 'google',
            access_token: providerToken,
            refresh_token: providerRefreshToken || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,provider' },
        )
      }

      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Return the user to an error page if something went wrong
  return NextResponse.redirect(`${origin}/?error=auth_callback_failed`)
}
