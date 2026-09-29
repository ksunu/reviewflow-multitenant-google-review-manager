import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { WorkspaceSelector } from '@/components/locations/WorkSpaceSelector'
import { getCurrentUser } from '@/lib/supabase/user'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tenantId?: string }>
}) {
  const supabase = await createClient()

  const user = await getCurrentUser()

  // 1. Fetch ALL tenants this user belongs to
  const { data: memberships, error: membershipError } = await supabase
    .from('tenant_users')
    .select('tenant_id, tenants(id, name)')
    .eq('user_id', user!.id)

  if (membershipError || !memberships || memberships.length === 0) {
    redirect('/onboarding')
  }

  const tenants = memberships.map((m: any) => m.tenants).filter(Boolean)

  // 2. Determine active tenant from searchParams or default to the first one
  const resolvedSearchParams = await searchParams
  const activeTenantId = resolvedSearchParams.tenantId || tenants[0]?.id
  const isValidTenant = tenants.some((t: any) => t.id === activeTenantId)
  const currentTenantId = isValidTenant ? activeTenantId : tenants[0].id

  // 3. Fetch dashboard stats SCOPED to the active tenant
  const { count: locationCount } = await supabase
    .from('locations')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', currentTenantId)

  // Fetch locations preview for this workspace
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, place_address')
    .eq('tenant_id', currentTenantId)
    .limit(4)

  const activeTenantName = tenants.find(
    (t: any) => t.id === currentTenantId,
  )?.name

  return (
    <div className="p-6 space-y-8 max-w-5xl mx-auto">
      {/* Header & Workspace Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 border rounded-xl shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Review Manager Dashboard
          </h1>
          <p className="text-xs text-gray-500">
            Managing reputation and AI replies for your workspace.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Workspace Switcher Component */}
          <WorkspaceSelector
            tenants={tenants}
            currentTenantId={currentTenantId}
          />

          <Link
            href={`/dashboard/locations?tenantId=${currentTenantId}`}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-md transition shadow-sm"
          >
            Manage Locations 📍
          </Link>
        </div>
      </div>

      {/* Quick Metrics / Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white border rounded-xl shadow-sm space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Linked Locations
          </p>
          <p className="text-2xl font-bold text-gray-900">
            {locationCount ?? 0}
          </p>
        </div>
        <div className="p-4 bg-white border rounded-xl shadow-sm space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Active Workspace
          </p>
          <p className="text-lg font-semibold text-purple-600 truncate">
            {activeTenantName}
          </p>
        </div>
        <div className="p-4 bg-white border rounded-xl shadow-sm space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            AI Sync Status
          </p>
          <p className="text-sm font-medium text-green-600 flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>{' '}
            Ready & Connected
          </p>
        </div>
      </div>

      {/* Locations Preview Section */}
      <div className="bg-white border rounded-xl p-6 space-y-4 shadow-sm">
        <div className="flex justify-between items-center">
          <h2 className="text-base font-bold text-gray-900">
            Workspace Locations Overview
          </h2>
          <Link
            href={`/dashboard/locations?tenantId=${currentTenantId}`}
            className="text-xs text-purple-600 hover:underline font-medium"
          >
            View All →
          </Link>
        </div>

        {locations && locations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {locations.map((loc) => (
              <div
                key={loc.id}
                className="p-3 border rounded-lg bg-gray-50 flex justify-between items-center"
              >
                <div>
                  <h3 className="font-semibold text-sm text-gray-800">
                    {loc.name}
                  </h3>
                  <p className="text-xs text-gray-500 truncate max-w-xs">
                    {loc.place_address || 'No address'}
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 bg-green-50 text-green-700 rounded-full font-medium">
                  Connected
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 space-y-2">
            <p className="text-sm text-gray-500">
              No locations linked to this workspace yet.
            </p>
            <Link
              href={`/dashboard/locations?tenantId=${currentTenantId}`}
              className="inline-block text-xs font-medium text-purple-600 hover:underline"
            >
              + Link your first location
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
