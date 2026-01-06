'use client'

import { Navbar } from '@/components/Navbar'
import { useAuth } from '@/components/AuthProvider'

export default function TermsOfServicePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      {user && <Navbar />}

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="card">
          <h1 className="text-3xl font-bold text-navy mb-8">Terms of Service</h1>
          
          <div className="prose max-w-none space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-bold text-navy mb-3">Acceptance of Terms</h2>
              <p>
                By accessing and using Pickup, you accept and agree to be bound by the terms and 
                provisions of this agreement.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-navy mb-3">User Accounts</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>You must be at least 13 years old to use this service</li>
                <li>You are responsible for maintaining the security of your account</li>
                <li>You must provide accurate and complete information</li>
                <li>You are responsible for all activities under your account</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-navy mb-3">Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Harass, abuse, or harm other users</li>
                <li>Post false, misleading, or inappropriate content</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Spam or send unsolicited messages</li>
                <li>Interfere with or disrupt the platform</li>
                <li>Use the platform for any commercial purposes without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-navy mb-3">Games and Activities</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Users organize games at their own risk</li>
                <li>Pickup is not liable for injuries or disputes during games</li>
                <li>Always follow local laws and venue rules</li>
                <li>Be respectful and courteous to all participants</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-navy mb-3">Content</h2>
              <p>
                By posting content on Pickup, you grant us a non-exclusive, worldwide license to 
                use, display, and distribute your content as necessary to operate the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-navy mb-3">Termination</h2>
              <p>
                We reserve the right to suspend or terminate accounts that violate these terms or 
                for any other reason at our discretion.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-navy mb-3">Limitation of Liability</h2>
              <p>
                Pickup is provided "as is" without warranties of any kind. We are not liable for 
                any damages arising from your use of the platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-navy mb-3">Changes to Terms</h2>
              <p>
                We may update these terms from time to time. Continued use of the platform after 
                changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-navy mb-3">Contact</h2>
              <p>
                Questions about these terms? Contact us at:{' '}
                <a href="mailto:massimochiarini25@gmail.com" className="text-sky-blue hover:underline">
                  massimochiarini25@gmail.com
                </a>
              </p>
            </section>

            <section className="text-sm text-gray-500 pt-6 border-t border-gray-200">
              <p>Last updated: {new Date().toLocaleDateString()}</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

