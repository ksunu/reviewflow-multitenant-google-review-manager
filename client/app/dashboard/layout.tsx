import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LanguageSwitcher } from '@/components/language/LanguageSwitcher'
import { getCurrentUser } from '@/lib/supabase/user'
import DashboardHeader from '@/components/navbar/DashboardHeader'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="bg-white border-b sticky top-0 z-30 shrink-0">
        <div className="px-6 h-16 flex items-center justify-between">
          <Link
            href="/dashboard"
            className="font-bold text-gray-900 text-lg tracking-tight flex items-center gap-2"
          >
            <span className="w-3 h-3 rounded-full bg-purple-600"></span>
            Review Manager
          </Link>
          <DashboardHeader />
          <LanguageSwitcher />
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col">{children}</div>
    </div>
  )
}
