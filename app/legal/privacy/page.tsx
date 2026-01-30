import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white/95 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="text-xl font-light text-charcoal tracking-tight">
            PickUp
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-light text-charcoal mb-8">Privacy Policy</h1>

        <div className="max-w-none">
          <p className="text-neutral-400 font-light mb-8">
            Last updated: January 2026
          </p>

          <section className="mb-10">
            <h2 className="text-lg font-medium text-charcoal mb-4">1. Information We Collect</h2>
            <p className="text-neutral-600 font-light mb-4">
              When you use PickUp, we collect information you provide directly to us, such as:
            </p>
            <ul className="list-disc pl-6 text-neutral-600 font-light space-y-2">
              <li>Account information (name, email, phone number)</li>
              <li>Profile information for instructors (bio, Instagram handle)</li>
              <li>Booking information (class reservations, payment details)</li>
              <li>Communications with us</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-medium text-charcoal mb-4">2. How We Use Your Information</h2>
            <p className="text-neutral-600 font-light mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-neutral-600 font-light space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send you confirmation texts and reminders about your bookings</li>
              <li>Respond to your comments and questions</li>
              <li>Protect against fraudulent or illegal activity</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-medium text-charcoal mb-4">3. Information Sharing</h2>
            <p className="text-neutral-600 font-light mb-4">
              We do not sell your personal information. We may share your information with:
            </p>
            <ul className="list-disc pl-6 text-neutral-600 font-light space-y-2">
              <li>Instructors for classes you book (name and booking details)</li>
              <li>Payment processors (Stripe) to complete transactions</li>
              <li>SMS providers (Twilio) to send booking confirmations</li>
              <li>Service providers who assist in our operations</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-medium text-charcoal mb-4">4. Data Security</h2>
            <p className="text-neutral-600 font-light leading-relaxed">
              We implement appropriate security measures to protect your personal information. 
              However, no method of transmission over the Internet is 100% secure.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-medium text-charcoal mb-4">5. Your Rights</h2>
            <p className="text-neutral-600 font-light mb-4">
              You may:
            </p>
            <ul className="list-disc pl-6 text-neutral-600 font-light space-y-2">
              <li>Access and update your account information</li>
              <li>Request deletion of your account</li>
              <li>Opt out of promotional communications</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-medium text-charcoal mb-4">6. Contact Us</h2>
            <p className="text-neutral-600 font-light">
              If you have questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:support@pikkup.com" className="text-charcoal hover:underline">
                support@pikkup.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-neutral-100">
          <Link href="/" className="text-neutral-400 hover:text-charcoal font-light flex items-center gap-2 transition-colors">
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  )
}
