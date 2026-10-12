'import client'
// components/ClientOnly.tsx
'use client'

import { ReactNode, useSyncExternalStore } from 'react'

export function ClientOnlyWrapper({
  children,
  fallback = null,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  const hasMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  if (!hasMounted) {
    return (
      <>
        {fallback ? (
          fallback
        ) : (
          <div className="min-h-screen flex items-center justify-center">
            Loading...
          </div>
        )}
      </>
    )
  }

  return <>{children}</>
}
