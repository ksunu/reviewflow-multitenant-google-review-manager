import { beforeEach, describe, expect, it, vi } from 'vitest'

const { createClient, redirect, rpc, single } = vi.hoisted(() => ({
  createClient: vi.fn(),
  redirect: vi.fn(),
  rpc: vi.fn(),
  single: vi.fn(),
}))

vi.mock('next/navigation', () => ({ redirect }))
vi.mock('@/lib/supabase/server', () => ({ createClient }))

import { completeOnboarding } from './actions'

describe('completeOnboarding', () => {
  beforeEach(() => {
    createClient.mockResolvedValue({
      auth: {
        getUser: vi
          .fn()
          .mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      },
      rpc,
    })
    rpc.mockReturnValue({ single })
    single.mockResolvedValue({
      data: { id: 'workspace-1' },
      error: null,
    })
  })

  it('creates a workspace and initial location, then redirects into it', async () => {
    const formData = new FormData()
    formData.set('businessName', '  Acme & Co  ')
    formData.set('locationName', '  Downtown  ')

    await completeOnboarding({ error: null }, formData)

    expect(rpc).toHaveBeenCalledWith('create_workspace_with_location', {
      p_name: 'Acme & Co',
      p_slug: 'acme-co',
      p_location_name: 'Downtown',
    })
    expect(redirect).toHaveBeenCalledWith('/dashboard/workspace-1')
  })

  it('returns a validation error without calling the workspace RPC', async () => {
    const formData = new FormData()
    formData.set('businessName', 'Acme')

    await expect(completeOnboarding({ error: null }, formData)).resolves.toEqual({
      error: 'Enter a workspace name and an initial location name.',
    })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('returns a safe error when workspace creation fails', async () => {
    const formData = new FormData()
    formData.set('businessName', 'Acme')
    formData.set('locationName', 'Downtown')
    single.mockResolvedValue({
      data: null,
      error: { message: 'database details' },
    })
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(completeOnboarding({ error: null }, formData)).resolves.toEqual({
      error: 'Failed to create your workspace. Please try again.',
    })
    expect(consoleError).toHaveBeenCalled()
  })
})
