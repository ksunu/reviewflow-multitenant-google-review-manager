import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PublicPlaceSearch } from '@/components/locations/PublicPlaceSearch'
import { LocationsList } from '@/components/locations/LocationsList'
import { WorkspaceSelector } from '@/components/locations/WorkSpaceSelector'
import Link from 'next/link'

export default async function LocationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()
  if (userError || !user) {
    redirect('/')
  }

  // 1. Fetch ALL tenants this user belongs to
  const { data: memberships, error: membershipError } = await supabase
    .from('tenant_users')
    .select('tenant_id, tenants(id, name)')
    .eq('user_id', user.id)

  if (membershipError || !memberships || memberships.length === 0) {
    redirect('/onboarding')
  }

  const tenants = memberships.map((m: any) => m.tenants).filter(Boolean)

  // 2. Determine active tenant from resolved searchParams or default to the first one
  const activeTenantId = resolvedSearchParams.tenantId || tenants[0]?.id
  const isValidTenant = tenants.some((t: any) => t.id === activeTenantId)
  const currentTenantId = isValidTenant ? activeTenantId : tenants[0].id

  // 3. Fetch linked locations for the active tenant
  const { data: linkedLocations } = await supabase
    .from('locations')
    .select('*')
    .eq('tenant_id', currentTenantId)

  return (
    <div className="p-6 space-y-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Manage Locations
          </h1>
          <p className="text-sm text-gray-500">
            Select a workspace and link Google Maps business locations.
          </p>
        </div>
        <Link
          href={`/dashboard?tenantId=${currentTenantId}`}
          className="text-sm text-purple-600 hover:underline font-medium"
        >
          ← Back to Overview
        </Link>
      </div>

      {/* Workspace Selector Component */}
      <div className="p-4 bg-white border rounded-xl shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Active Workspace
          </label>
          <WorkspaceSelector
            tenants={tenants}
            currentTenantId={currentTenantId}
          />
        </div>
        <Link
          href="/onboarding"
          className="text-xs text-purple-600 hover:text-purple-800 font-medium px-3 py-1.5 border border-purple-200 rounded-md bg-purple-50 transition"
        >
          + Create New Workspace
        </Link>
      </div>

      {/* Locations List */}
      <LocationsList locations={linkedLocations || []} />

      {/* Google Maps Search & Link Tool */}
      <div className="pt-4 border-t">
        <PublicPlaceSearch tenantId={currentTenantId} />
      </div>
    </div>
  )
}
