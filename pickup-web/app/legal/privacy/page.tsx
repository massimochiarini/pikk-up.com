'use client'

import { Navbar } from '@/components/Navbar'
import { useAuth } from '@/components/AuthProvider'

export default function PrivacyPolicyPage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      {user && <Navbar />}

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="card">
          <h1 className="text-3xl font-bold text-navy mb-8">Privacy Policy</h1>
          
          <div className="prose max-w-none space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-bold text-navy mb-3">Introduction</h2>
              <p>
                At Pickup, we take your privacy seriously. This Privacy Policy explains how we collect, 
                use, and protect your personal information when you use our platform.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-navy mb-3">Information We Collect</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> Name, email address, username, and profile details</li>
                <li><strong>Location Data:</strong> Approximate location to help you find nearby games (optional)</li>
                <li><strong>Game Data:</strong> Games you create, join, and RSVP to</li>
                <li><strong>Messages:</strong> Communications between users on the platform</li>
                <li><strong>Usage Data:</strong> How you interact with our platform</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-navy mb-3">How We Use Your Information</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>To provide and improve our services</li>
                <li>To connect you with nearby games and players</li>
                <li>To facilitate communication between users</li>
                <li>To send important updates about your games and account</li>
                <li>To maintain platform security and prevent abuse</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-navy mb-3">Data Sharing</h2>
              <p>
                We do not sell your personal information. We only share your data:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>With other users as necessary to facilitate games and connections</li>
                <li>When required by law or to protect our legal rights</li>
                <li>With service providers who help us operate the platform (under strict confidentiality)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-navy mb-3">Your Rights</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access and update your personal information</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of optional data collection (like location)</li>
                <li>Export your data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-bold text-navy mb-3">Data Security</h2>
              <p>
                We implement industry-standard security measures to protect your data. However, no 
                method of transmission over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-navy mb-3">Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, please contact us at:{' '}
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

