'use client'

import Link from 'next/link'
import { EmailGate } from '@/components/EmailGate'

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b border-stone-100">
        <div className="max-w-2xl mx-auto px-6 py-5">
          <Link href="/" className="text-stone-500 tracking-wide text-lg hover:text-stone-700 transition-colors">
            PickUp
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center px-6 py-12">
        <div className="max-w-2xl mx-auto w-full">
          <h1 className="text-2xl font-light text-stone-800 tracking-tight mb-2">
            Welcome
          </h1>
          <EmailGate
            intro="PickUp is drop-in yoga at a studio in Miami. Book a class, show up, and flow."
            ctaText="Enter your email to claim your first class free"
            successMessage="Free class unlocked—book now"
            redirectTo="/classes?free=1"
            showRoleChoice={true}
          />
        </div>
      </main>
    </div>
  )
}
