import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { WorkspaceSelector } from '@/components/locations/WorkSpaceSelector'
import { LanguageSwitcher } from '@/components/language/LanguageSwitcher'
import { getCurrentUser } from '@/lib/supabase/user'

export default async function DashboardLayout({
  children,
  searchParams,
}: {
  children: React.ReactNode
  searchParams: Promise<{ tenantId?: string }>
}) {
  const resolvedSearchParams = await searchParams
  const supabase = await createClient()

  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  // Fetch all user tenants
  const { data: memberships, error: membershipError } = await supabase
    .from('tenant_users')
    .select('tenant_id, tenants(id, name)')
    .eq('user_id', user.id)

  if (membershipError || !memberships || memberships.length === 0) {
    redirect('/onboarding')
  }

  const tenants = memberships.map((m: any) => m.tenants).filter(Boolean)
  const activeTenantId = resolvedSearchParams?.tenantId || tenants[0]?.id
  const isValidTenant = tenants.some((t: any) => t.id === activeTenantId)
  const currentTenantId = isValidTenant ? activeTenantId : tenants[0].id

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <Link
              href={`/dashboard?tenantId=${currentTenantId}`}
              className="font-bold text-gray-900 text-lg tracking-tight flex items-center gap-2"
            >
              <span className="w-3 h-3 rounded-full bg-purple-600"></span>
              Review Manager
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-600">
              <Link
                href={`/dashboard?tenantId=${currentTenantId}`}
                className="hover:text-purple-600 transition"
              >
                Overview
              </Link>
              <Link
                href={`/dashboard/locations?tenantId=${currentTenantId}`}
                className="hover:text-purple-600 transition"
              >
                Locations
              </Link>
            </nav>
          </div>

          {/* Workspace Switcher & User Profile */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 p-1.5 border rounded-lg">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-1">
                Workspace:
              </span>
              <WorkspaceSelector
                tenants={tenants}
                currentTenantId={currentTenantId}
              />
            </div>

            <Link
              href="/onboarding"
              title="Create new workspace"
              className="p-2 text-gray-500 hover:text-purple-600 border rounded-lg bg-white hover:bg-gray-50 transition text-xs font-medium"
            >
              + New
            </Link>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6">{children}</main>
    </div>
  )
}
