// @vitest-environment jsdom

import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useWorkspaceStats } from './use-workspace-stats'

const { client, queryFilters } = vi.hoisted(() => ({
  client: { from: vi.fn() },
  queryFilters: [] as Array<{ table: string; column: string; ids: string[] }>,
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => client,
}))

describe('useWorkspaceStats', () => {
  beforeEach(() => {
    client.from.mockReset()
    queryFilters.length = 0
    vi.spyOn(console, 'log').mockImplementation(() => {})
    client.from.mockImplementation((table: string) => {
      const query = {
        select: vi.fn(),
        in: vi.fn(),
      }
      query.select.mockReturnValue(query)
      query.in.mockImplementation(async (column: string, ids: string[]) => {
        queryFilters.push({ table, column, ids })
        return {
          data:
            table === 'workspace_review_stats'
              ? [
                  {
                    workspace_id: 'workspace-a',
                    total_reviews: 2,
                    average_rating: 4.5,
                    positive_count: 1,
                    neutral_count: 1,
                    negative_count: 0,
                    posted_replies_count: 1,
                  },
                ]
              : [{ rating: 5 }, { rating: 4 }],
          error: null,
        }
      })
      return query
    })
  })

  it('scopes stats and rating distribution to the selected workspace', async () => {
    const { result } = renderHook(() =>
      useWorkspaceStats(['workspace-a', 'workspace-b'], 'workspace-a'),
    )

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(queryFilters).toEqual([
      {
        table: 'workspace_review_stats',
        column: 'workspace_id',
        ids: ['workspace-a'],
      },
      { table: 'reviews', column: 'workspace_id', ids: ['workspace-a'] },
    ])
    expect(result.current.stats).toMatchObject({
      workspace_id: 'workspace-a',
      total_reviews: 2,
      average_rating: 4.5,
    })
    expect(result.current.ratingDistribution).toEqual([
      { rating: 5, count: 1 },
      { rating: 4, count: 1 },
      { rating: 3, count: 0 },
      { rating: 2, count: 0 },
      { rating: 1, count: 0 },
    ])
  })
})
