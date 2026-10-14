import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getWorkspaceAuthorization } from '@/lib/supabase/authorization'
import { POST } from './route'

type SupabaseServerClient = NonNullable<
  Parameters<typeof getWorkspaceAuthorization>[1]
>

vi.mock('@/lib/supabase/authorization', () => ({
  getWorkspaceAuthorization: vi.fn(),
}))

const workspaceId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const reviewId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'

function createSupabaseClient() {
  const rpc = vi.fn().mockResolvedValue({
    data: { used: 3, limit: 10 },
    error: null,
  })
  const from = vi.fn((table: string) => {
    const query = {
      select: vi.fn(),
      eq: vi.fn(),
      single: vi.fn().mockResolvedValue(
        table === 'workspaces'
          ? {
              data: {
                id: workspaceId,
                name: 'Workspace A',
                business_type: 'cafe',
                ai_reply_limit: 10,
                ai_replies_used_this_month: 2,
              },
              error: null,
            }
          : {
              data: {
                id: reviewId,
                reply_status: 'pending',
                author_name: 'Customer',
                rating: 5,
                review_text: 'Great service',
                sentiment: 'positive',
                locations: {
                  name: 'Location A',
                  address: '1 Main Street',
                  business_type: 'cafe',
                  workspace_id: workspaceId,
                },
              },
              error: null,
            },
      ),
    }
    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    return query
  })

  return { from, rpc }
}

function createRequest(body: unknown) {
  return new Request(
    `http://localhost/api/workspaces/${workspaceId}/ai-reply`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  )
}

function post(request: Request, requestedWorkspaceId = workspaceId) {
  return POST(request, {
    params: Promise.resolve({ workspaceId: requestedWorkspaceId }),
  })
}

describe('workspace AI reply endpoint', () => {
  beforeEach(() => {
    vi.mocked(getWorkspaceAuthorization).mockReset()
    vi.stubGlobal(
      'fetch',
      vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body)) as { prompt?: string }
        return Response.json({
          response: body.prompt?.startsWith('Classify')
            ? 'positive'
            : 'Thank you for your kind review.',
        })
      }),
    )
  })

  it('returns 401 when the caller is unauthenticated', async () => {
    vi.mocked(getWorkspaceAuthorization).mockResolvedValue({
      authorized: false,
      status: 401,
    })

    const response = await post(createRequest({ reviewId }))

    expect(response.status).toBe(401)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('denies a non-member before invoking an AI provider', async () => {
    vi.mocked(getWorkspaceAuthorization).mockResolvedValue({
      authorized: false,
      status: 403,
    })

    const response = await post(createRequest({ reviewId }))

    expect(response.status).toBe(403)
    expect(fetch).not.toHaveBeenCalled()
  })

  it('returns 400 when the review ID is missing or invalid', async () => {
    const supabase = createSupabaseClient()
    vi.mocked(getWorkspaceAuthorization).mockResolvedValue({
      authorized: true,
      supabase: supabase as unknown as SupabaseServerClient,
      user: {
        id: 'user-a',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '',
      },
      role: 'member',
    })

    const missingReviewId = await post(createRequest({}))
    const invalidReviewId = await post(createRequest({ reviewId: 'not-a-uuid' }))

    expect(missingReviewId.status).toBe(400)
    expect(invalidReviewId.status).toBe(400)
    expect(supabase.from).not.toHaveBeenCalled()
    expect(supabase.rpc).not.toHaveBeenCalled()
  })

  it('saves the reply and consumes quota through the atomic workspace RPC', async () => {
    const supabase = createSupabaseClient()
    vi.mocked(getWorkspaceAuthorization).mockResolvedValue({
      authorized: true,
      supabase: supabase as unknown as SupabaseServerClient,
      user: {
        id: 'user-a',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '',
      },
      role: 'member',
    })

    const response = await post(createRequest({ reviewId }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({
      reply: 'Thank you for your kind review.',
      sentiment: 'positive',
      usage: { used: 3, limit: 10 },
    })
    expect(supabase.rpc).toHaveBeenCalledWith('save_ai_reply_atomically', {
      p_workspace_id: workspaceId,
      p_review_id: reviewId,
      p_reply: 'Thank you for your kind review.',
      p_sentiment: 'positive',
    })
  })
})
