'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export function useLocations(workspaceId: string) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['locations', workspaceId],
    queryFn: async () => {
      if (!workspaceId) return []

      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(error.message)
      }

      return data || []
    },
    // Only run the query if workspaceId is provided
    enabled: Boolean(workspaceId),
  })
}
