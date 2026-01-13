import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/AuthProvider'

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Pikk Up | Yoga Studio Marketplace',
  description: 'Book yoga classes at our studio. Find sessions with amazing instructors, reserve your spot, and transform your practice.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={outfit.variable}>
      <body className="font-body min-h-screen">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
