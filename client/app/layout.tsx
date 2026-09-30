import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { I18nProvider } from '@/components/providers/I18nProvider'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Review Manager',
  description:
    'Review management application for businesses and organizations.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_MAPS_API_KEY}&libraries=places&loading=async`}
        async
        defer
      ></script>
      <html lang="en" className="h-full">
        <body className="min-h-full flex flex-col" suppressHydrationWarning>
          <I18nProvider>{children}</I18nProvider>
        </body>
      </html>
    </>
  )
}
