import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-cream">
      <header className="bg-white/80 backdrop-blur-md border-b border-sand-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link href="/" className="text-xl font-bold text-sage-700">
            Pikk<span className="text-terracotta-500">Up</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-charcoal mb-8">Terms of Service</h1>

        <div className="prose prose-sand max-w-none">
          <p className="text-sand-600 mb-6">
            Last updated: January 2026
          </p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-charcoal mb-4">1. Acceptance of Terms</h2>
            <p className="text-sand-700">
              By accessing and using PikkUp, you agree to be bound by these Terms of Service. 
              If you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-charcoal mb-4">2. Description of Service</h2>
            <p className="text-sand-700">
              PikkUp is a marketplace platform that connects yoga students with instructors 
              for classes at our studio location. We facilitate bookings and payments but 
              are not responsible for the quality of instruction provided.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-charcoal mb-4">3. User Accounts</h2>
            <p className="text-sand-700 mb-4">
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 text-sand-700 space-y-2">
              <li>Maintaining the confidentiality of your account</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and complete information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-charcoal mb-4">4. For Students</h2>
            <ul className="list-disc pl-6 text-sand-700 space-y-2">
              <li>Bookings are confirmed upon successful payment</li>
              <li>Arrive 10-15 minutes early for classes</li>
              <li>Cancellation policies may apply based on class timing</li>
              <li>Consult a physician before beginning any exercise program</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-charcoal mb-4">5. For Instructors</h2>
            <ul className="list-disc pl-6 text-sand-700 space-y-2">
              <li>You must be qualified to teach yoga classes</li>
              <li>You are responsible for the content and safety of your classes</li>
              <li>You agree to honor all bookings made through the platform</li>
              <li>You must maintain appropriate liability insurance</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-charcoal mb-4">6. Payments</h2>
            <p className="text-sand-700">
              All payments are processed securely through Stripe. By making a purchase, 
              you agree to Stripe&apos;s terms of service. Refunds are handled on a case-by-case basis.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-charcoal mb-4">7. Limitation of Liability</h2>
            <p className="text-sand-700">
              PikkUp is not liable for any injuries, damages, or losses incurred during 
              yoga classes booked through our platform. Participation in yoga classes 
              is at your own risk.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-charcoal mb-4">8. Changes to Terms</h2>
            <p className="text-sand-700">
              We reserve the right to modify these terms at any time. Continued use of 
              the service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-charcoal mb-4">9. Contact</h2>
            <p className="text-sand-700">
              For questions about these Terms, contact us at{' '}
              <a href="mailto:support@pikkup.com" className="text-sage-600 hover:underline">
                support@pikkup.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-sand-200">
          <Link href="/" className="text-sage-600 hover:text-sage-700 font-medium">
            ← Back to Home
          </Link>
        </div>
      </main>
    </div>
  )
}
