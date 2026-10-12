'use client'

import { useRouter, usePathname } from 'next/navigation'

interface Tenant {
  id: string
  name: string
}

export function WorkspaceSelector({
  tenants,
  currentTenantId,
}: {
  tenants: Tenant[]
  currentTenantId: string
}) {
  const router = useRouter()
  const pathname = usePathname()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTenantId = e.target.value
    // Preserve the current path (e.g., /dashboard or /dashboard/locations) and update searchParam
    router.push(`${pathname}?tenantId=${newTenantId}`)
  }

  return (
    <select
      value={currentTenantId}
      onChange={handleChange}
      className="px-3 py-1.5 border rounded-md text-sm font-medium bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
    >
      {tenants.map((t) => (
        <option key={t.id} value={t.id}>
          {t.name}
        </option>
      ))}
    </select>
  )
}
