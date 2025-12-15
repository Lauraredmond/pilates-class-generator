/**
 * Beta Tester Agreement Page
 * Displays Bassline Pilates Beta Tester Agreement
 */

import { useNavigate } from 'react-router-dom';

export function BetaAgreement() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-burgundy py-12 px-4">
      <div className="max-w-4xl mx-auto bg-cream rounded-lg shadow-xl p-8 md:p-12">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate(-1)} className="text-burgundy hover:underline text-sm mb-4 inline-block">
            ← Back
          </button>
          <h1 className="text-4xl font-bold text-burgundy mb-2">Beta Tester Agreement</h1>
          <p className="text-charcoal/60 text-sm">
            Beta Version
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-burgundy max-w-none space-y-6 text-charcoal">
          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">1. Introduction</h2>
            <p>
              Thank you for participating as a beta tester for Bassline Pilates. This Agreement outlines your responsibilities, our commitments, and important limitations while using the Bassline Pilates beta application ("the Service").
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">2. Purpose of Beta Testing</h2>
            <p>
              The beta version is provided for the purpose of testing, feedback, and identification of bugs, usability issues, and security improvements. Features are experimental and may change.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">3. Voluntary Participation</h2>
            <p>
              Your participation is voluntary and you may stop using the beta at any time.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">4. Health & Safety Disclaimer</h2>
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <p className="font-semibold text-yellow-800 mb-2">Important:</p>
              <ul className="list-disc pl-6 text-yellow-900 space-y-1">
                <li>Bassline Pilates is an exercise‑support tool intended to supplement—not replace—professional Pilates instruction.</li>
                <li>Always consult a medical professional before beginning any new exercise program.</li>
                <li>You participate at your own risk.</li>
                <li>Stop exercising immediately if you feel pain, dizziness, or discomfort.</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">5. Data Collected</h2>
            <p>During beta testing, the Service may collect:</p>
            <ul className="list-disc pl-6">
              <li>Account details (email, optional profile info)</li>
              <li>Class selections and workout history</li>
              <li>Muscle‑group usage records</li>
              <li>App interactions and analytics events</li>
              <li>Device metadata (browser type, timestamp)</li>
            </ul>
            <p className="text-sm italic mt-3">
              Note: Educational video content is delivered from AWS S3 (United States) via CloudFront CDN. These videos contain no user data — only Bassline-created Pilates demonstrations.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">6. Confidentiality</h2>
            <p>
              The beta version, its features, and materials are confidential. You agree not to share screenshots, videos, or details publicly without permission.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">7. Security Measures</h2>
            <p>Bassline Pilates has undergone early-stage security testing, including:</p>
            <ul className="list-disc pl-6">
              <li>Claude Code secure‑coding review</li>
              <li>GitGuardian secret‑leak scanning</li>
              <li>OWASP ZAP local web‑app scanning</li>
              <li>Wireshark packet inspection verifying no PII is transmitted in clear text</li>
            </ul>
            <p className="text-sm italic">These tests identify issues, but cannot guarantee complete security.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">8. No Warranty</h2>
            <p>The Service is provided "as is."</p>
            <p>We do not guarantee uptime, accuracy, safety, or fitness for any purpose.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">9. Limitation of Liability</h2>
            <p>To the maximum extent allowed by law, Bassline Pilates is not responsible for:</p>
            <ul className="list-disc pl-6">
              <li>Injuries sustained while performing exercises</li>
              <li>Data loss, service interruptions, or technical issues</li>
              <li>Decisions made based on beta functionality or outputs</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">10. Your Feedback</h2>
            <p>
              By providing feedback, you grant Bassline Pilates permission to use your comments for product improvement without obligation or compensation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">11. Governing Law</h2>
            <p>This Agreement is governed by the laws of Ireland.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">12. Contact</h2>
            <p>
              For questions or concerns: <a href="mailto:laura.redm@gmail.com" className="text-burgundy hover:underline">laura.redm@gmail.com</a> or else use the feedback link within the application settings page.
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
