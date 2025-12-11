/**
 * Data During Beta Testing Page
 * Explains how user data is handled during beta testing
 */

import { useNavigate } from 'react-router-dom';

export function DataDuringBeta() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-burgundy py-12 px-4">
      <div className="max-w-4xl mx-auto bg-cream rounded-lg shadow-xl p-8 md:p-12">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate(-1)} className="text-burgundy hover:underline text-sm mb-4 inline-block">
            ← Back
          </button>
          <h1 className="text-4xl font-bold text-burgundy mb-2">Your Data During Beta Testing</h1>
          <p className="text-charcoal/70 text-lg">
            Clear and simple terms about how your data is used and protected
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-burgundy max-w-none space-y-6 text-charcoal">
          <p className="text-lg">
            Thank you for taking part in the Bassline Pilates beta. This document explains, in clear and simple terms, how your data is used, stored, and protected while the app is still in early testing.
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">1. What Data We Collect</h2>
            <p>During beta testing we collect only the data needed to provide your personalised Pilates experience and improve the stability of the app:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Email address (for login and account recovery)</li>
              <li>Password (securely hashed; never visible to us)</li>
              <li>Age Range</li>
              <li>Gender Identity</li>
              <li>Country</li>
              <li>Your class preferences (duration, ability level, intensity)</li>
              <li>Your practice history (movements performed, timestamps, muscle-group usage)</li>
              <li>Basic device information (browser type, operating system, timestamp)</li>
              <li>Non-identifying analytics (page views, crashes, errors)</li>
            </ul>
            <p className="font-medium text-sm bg-green-50 p-3 rounded border-l-4 border-green-500 mt-4">
              We do not collect biometric data, medical information, GPS location, microphone or camera data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">2. Why We Collect This Data</h2>
            <p>We use your information to:</p>
            <ul className="list-disc pl-6">
              <li>Generate tailored Pilates classes</li>
              <li>Track progression and maintain balanced muscle engagement</li>
              <li>Improve accuracy and stability of the class‑generation engine</li>
              <li>Diagnose bugs and performance issues</li>
              <li>Keep your account secure through activity logs</li>
            </ul>
            <p className="font-medium mt-3">
              We do not use your data for advertising, profiling, or resale.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">3. Where Your Data Is Stored</h2>
            <p>Your data stays within the EU for all core functions:</p>
            <div className="bg-burgundy/5 p-4 rounded space-y-2">
              <div className="flex items-start gap-3">
                <span className="text-burgundy font-bold">•</span>
                <div>
                  <strong>Supabase</strong> – Primary database in Ireland (eu-west-1)
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-burgundy font-bold">•</span>
                <div>
                  <strong>Render</strong> – Backend services in Frankfurt, Germany (eu-central-1)
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-burgundy font-bold">•</span>
                <div>
                  <strong>Netlify</strong> – Serves only the frontend; does not store personal data
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-burgundy font-bold">•</span>
                <div>
                  <strong>Resend</strong> – Sends emails through EU infrastructure; limited metadata may be processed in the US under GDPR Standard Contractual Clauses (SCCs)
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">4. Security Measures in Place</h2>
            <p>To protect your data, we have performed early-stage security testing including:</p>
            <ul className="list-disc pl-6">
              <li>Claude Code secure-coding review</li>
              <li>GitGuardian secret scanning</li>
              <li>AuditNOM dependency and supply-chain analysis</li>
              <li>OWASP ZAP automated scanning</li>
              <li>Review of authentication, authorisation, and Supabase Row-Level Security</li>
              <li>Wireshark packet analysis to ensure no PII is sent in clear text</li>
            </ul>
            <p className="font-medium mt-3">
              All communication between your device and our servers uses HTTPS encryption.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">5. How Long We Keep Your Data</h2>
            <p>Your data is retained for the duration of the beta.</p>
            <p className="text-sm">
              If you stop using the beta, we may remove inactive accounts after 12 months.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">6. Your Rights</h2>
            <p>You may:</p>
            <ul className="list-disc pl-6">
              <li>Request a copy of your data</li>
              <li>Ask for corrections</li>
              <li>Request deletion</li>
              <li>Withdraw from the beta at any time</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">7. Your Responsibilities</h2>
            <ul className="list-disc pl-6">
              <li>Use a strong password</li>
              <li>Do not share screenshots or internal features publicly</li>
              <li>Inform us of bugs or security concerns</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">8. Contact</h2>
            <p>
              If you have any questions about how your data is handled during beta testing:
            </p>
            <p className="mt-2">
              Email: <a href="mailto:laura.redm@gmail.com" className="text-burgundy hover:underline">laura.redm@gmail.com</a> or the feedback link on the application settings page.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-charcoal/20">
          <button onClick={() => navigate(-1)} className="text-burgundy hover:underline font-medium">
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
