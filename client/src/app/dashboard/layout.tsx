import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LanguageSwitcher } from '@/components/language/LanguageSwitcher'
import { getCurrentUser } from '@/lib/supabase/user'
import DashboardHeader, {
  WorkspaceSidebarTrigger,
} from '@/components/navbar/DashboardHeader'
import { SidebarProvider } from '@/components/ui/sidebar'
import Image from 'next/image'
import AppLogo from '@/lib/images/logo_no_background.svg'

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
    <div className="flex h-dvh flex-col overflow-hidden bg-background">
      <SidebarProvider className="flex min-h-0 flex-1 flex-col">
        <header className="bg-white border-b sticky top-0 z-30 shrink-0">
          <div className="px-6 h-16 flex items-center justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <WorkspaceSidebarTrigger />
              <Link
                href="/dashboard"
                className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight text-gray-900"
              >
                <Image src={AppLogo} height={24} alt="Review Manager Logo" />
                <span className="hidden sm:inline">Review Manager</span>
              </Link>
            </div>
            <DashboardHeader />
            <LanguageSwitcher />
          </div>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      </SidebarProvider>
    </div>
  )
}
