import { describe, expect, it, vi } from 'vitest'
import { getWorkspaceAuthorization } from './authorization'

type SupabaseServerClient = NonNullable<
  Parameters<typeof getWorkspaceAuthorization>[1]
>

function createSupabaseClient(
  user: { id: string } | null,
  membership: { role: string } | null,
) {
  const maybeSingle = vi.fn().mockResolvedValue({ data: membership, error: null })
  const userFilter = vi.fn(() => ({ maybeSingle }))
  const workspaceFilter = vi.fn(() => ({ eq: userFilter }))
  const select = vi.fn(() => ({ eq: workspaceFilter }))
  const from = vi.fn(() => ({ select }))
  const getUser = vi.fn().mockResolvedValue({
    data: { user },
    error: user ? null : new Error('No authenticated user'),
  })

  return {
    client: {
      auth: { getUser },
      from,
    },
    from,
    workspaceFilter,
    userFilter,
  }
}

describe('getWorkspaceAuthorization', () => {
  it('returns 401 without querying workspace membership when unauthenticated', async () => {
    const { client, from } = createSupabaseClient(null, null)

    const result = await getWorkspaceAuthorization(
      'workspace-a',
      client as unknown as SupabaseServerClient,
    )

    expect(result).toEqual({ authorized: false, status: 401 })
    expect(from).not.toHaveBeenCalled()
  })

  it('returns 403 when the authenticated user is not a workspace member', async () => {
    const { client, from, workspaceFilter, userFilter } =
      createSupabaseClient({ id: 'user-a' }, null)

    const result = await getWorkspaceAuthorization(
      'workspace-b',
      client as unknown as SupabaseServerClient,
    )

    expect(result).toEqual({ authorized: false, status: 403 })
    expect(from).toHaveBeenCalledWith('workspace_members')
    expect(workspaceFilter).toHaveBeenCalledWith('workspace_id', 'workspace-b')
    expect(userFilter).toHaveBeenCalledWith('user_id', 'user-a')
  })

  it('authorizes a member of the requested workspace', async () => {
    const { client } = createSupabaseClient({ id: 'user-a' }, { role: 'member' })

    const result = await getWorkspaceAuthorization(
      'workspace-a',
      client as unknown as SupabaseServerClient,
    )

    expect(result).toMatchObject({
      authorized: true,
      role: 'member',
      user: { id: 'user-a' },
    })
  })
})
