/**
 * Privacy Policy Page
 * GDPR-compliant privacy policy with AWS disclosure
 */

export function Privacy() {
  return (
    <div className="min-h-screen bg-burgundy py-12 px-4">
      <div className="max-w-4xl mx-auto bg-charcoal rounded-lg p-8 border-2 border-cream/10">
        <h1 className="text-4xl font-bold text-cream mb-6">Privacy Policy</h1>
        <p className="text-cream/60 text-sm mb-8">Last Updated: December 15, 2025</p>

        <div className="prose prose-invert prose-cream max-w-none space-y-6 text-cream/90">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-cream mb-4">1. Introduction</h2>
            <p>
              Bassline Pilates ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our Pilates class planning platform (the "Service").
            </p>
            <p>
              By using our Service, you agree to the collection and use of information in accordance with this policy. We are committed to compliance with the EU General Data Protection Regulation (GDPR) and other applicable data protection laws.
            </p>
          </section>

          {/* Data Controller */}
          <section>
            <h2 className="text-2xl font-semibold text-cream mb-4">2. Data Controller</h2>
            <p>
              Bassline Pilates is the data controller responsible for your personal information. For any privacy-related inquiries, you can contact us at:
            </p>
            <ul className="list-disc list-inside ml-4">
              <li>Email: privacy@basslinepilates.com</li>
              <li>Data Protection Officer: Available upon request</li>
            </ul>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-semibold text-cream mb-4">3. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-cream mb-3">3.1 Personal Information You Provide</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Account Information:</strong> Email address, name, password (encrypted)</li>
              <li><strong>Profile Information:</strong> Optional biography, experience level, preferences</li>
              <li><strong>Health & Safety Acknowledgment:</strong> Confirmation that you accept our health disclaimer</li>
              <li><strong>Class Preferences:</strong> AI strictness level, default class duration, music style preferences</li>
            </ul>

            <h3 className="text-xl font-semibold text-cream mb-3 mt-6">3.2 Automatically Collected Information</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Usage Data:</strong> How you interact with our Service (page views, features used, time spent)</li>
              <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers</li>
              <li><strong>AI Decision Logs:</strong> Parameters and outputs from AI-generated class plans (for EU AI Act transparency)</li>
            </ul>

            <h3 className="text-xl font-semibold text-cream mb-3 mt-6">3.3 Information We Do NOT Collect</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>We do NOT collect sensitive health information beyond your self-reported experience level</li>
              <li>We do NOT track your location</li>
              <li>We do NOT record or store video/audio of you</li>
              <li>We do NOT sell your personal information to third parties</li>
            </ul>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-semibold text-cream mb-4">4. How We Use Your Information</h2>
            <p>We use your information for the following purposes:</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Service Provision:</strong> To create and manage your account, generate Pilates classes, and provide personalized recommendations</li>
              <li><strong>Communication:</strong> To send you service updates, class reminders, and respond to your inquiries (only if you've opted in)</li>
              <li><strong>Service Improvement:</strong> To analyze usage patterns, improve our AI models, and develop new features</li>
              <li><strong>Legal Compliance:</strong> To comply with EU AI Act transparency requirements and GDPR obligations</li>
              <li><strong>Security:</strong> To detect, prevent, and address fraud, security issues, and technical problems</li>
            </ul>
          </section>

          {/* Third-Party Services */}
          <section>
            <h2 className="text-2xl font-semibold text-cream mb-4">5. Third-Party Services & Data Location</h2>

            <h3 className="text-xl font-semibold text-cream mb-3">5.1 User Data Storage (Supabase - Europe)</h3>
            <p>
              <strong>All user personal data is stored in Europe via Supabase.</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>What:</strong> Account information, class plans, preferences, authentication tokens</li>
              <li><strong>Where:</strong> EU data centers (Frankfurt, Germany or similar)</li>
              <li><strong>Why:</strong> GDPR compliance, low latency for European users, data sovereignty</li>
              <li><strong>Security:</strong> Row-Level Security (RLS), AES-256 encryption at rest, TLS 1.3 in transit</li>
            </ul>

            <h3 className="text-xl font-semibold text-cream mb-3 mt-6">5.2 Educational Content Storage (AWS CloudFront/S3 - United States)</h3>
            <p>
              <strong>Movement demonstration videos are stored in the United States via AWS S3.</strong>
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>What:</strong> Pre-recorded Pilates movement demonstration videos (Bassline-created content)</li>
              <li><strong>What NOT:</strong> No user-generated content, no user videos, no personal data</li>
              <li><strong>Where:</strong> AWS S3 (United States) + CloudFront CDN (global edge locations)</li>
              <li><strong>Why:</strong> Cost-effective video delivery, global CDN for fast loading, scalability</li>
              <li><strong>Data Residency:</strong> US-based storage is compliant as no personal data is involved (only educational content)</li>
            </ul>

            <h3 className="text-xl font-semibold text-cream mb-3 mt-6">5.3 AI Processing (OpenAI - United States)</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>What:</strong> AI-generated class plans when you use AI mode (optional feature)</li>
              <li><strong>Data Sent:</strong> Only your class preferences (difficulty, duration, focus areas) - NO personal identifiers</li>
              <li><strong>Where:</strong> OpenAI API (United States)</li>
              <li><strong>Data Retention:</strong> OpenAI retains data for 30 days for abuse monitoring (per their policy), then deleted</li>
              <li><strong>Control:</strong> You can disable AI mode and use database-only class generation (Settings → AI Class Generation)</li>
            </ul>

            <h3 className="text-xl font-semibold text-cream mb-3 mt-6">5.4 Music Streaming (Internet Archive - United States)</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>What:</strong> Public domain classical music for class accompaniment</li>
              <li><strong>Where:</strong> Internet Archive CDN (United States)</li>
              <li><strong>Data Sent:</strong> None - direct streaming from archive.org, no user tracking</li>
            </ul>

            <h3 className="text-xl font-semibold text-cream mb-3 mt-6">5.5 Hosting & API Services</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Frontend Hosting:</strong> Netlify (United States) - static files only, no user data</li>
              <li><strong>Backend API:</strong> Render (United States) - processes requests but stores data in Supabase EU</li>
            </ul>
          </section>

          {/* Data Transfers */}
          <section>
            <h2 className="text-2xl font-semibold text-cream mb-4">6. International Data Transfers</h2>
            <p>
              While your personal data is stored in the EU (Supabase), some data processing occurs in the United States (API servers, AI processing). We ensure adequate protection through:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Standard Contractual Clauses (SCCs):</strong> EU-approved data transfer mechanisms</li>
              <li><strong>Data Minimization:</strong> Only necessary data is transferred for processing</li>
              <li><strong>Encryption:</strong> All data transfers use TLS 1.3 encryption</li>
              <li><strong>No Permanent US Storage:</strong> User data is only transiently processed, never stored permanently in the US</li>
            </ul>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-semibold text-cream mb-4">7. Your Rights Under GDPR</h2>
            <p>As a data subject, you have the following rights:</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Right of Access (Article 15):</strong> Request a copy of your personal data (Settings → Data, Privacy & Compliance → Download My Data)</li>
              <li><strong>Right to Rectification (Article 16):</strong> Correct inaccurate personal data (Settings → Security → Profile or Password)</li>
              <li><strong>Right to Erasure (Article 17):</strong> Request deletion of your personal data (Settings → Danger Zone → Delete Account)</li>
              <li><strong>Right to Restrict Processing (Article 18):</strong> Limit how we use your data</li>
              <li><strong>Right to Data Portability (Article 20):</strong> Export your data in JSON format</li>
              <li><strong>Right to Object (Article 21):</strong> Object to processing based on legitimate interests</li>
              <li><strong>Right to Withdraw Consent:</strong> Disable AI processing, analytics, or email notifications at any time</li>
            </ul>
            <p className="mt-4">
              To exercise any of these rights, visit Settings → Data, Privacy & Compliance or contact privacy@basslinepilates.com.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold text-cream mb-4">8. Data Retention</h2>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Account Data:</strong> Retained while your account is active</li>
              <li><strong>Class Plans:</strong> Retained until you delete them or close your account</li>
              <li><strong>AI Decision Logs:</strong> Retained for 2 years (EU AI Act compliance), then automatically deleted</li>
              <li><strong>Deleted Accounts:</strong> All personal data permanently deleted within 30 days of account deletion</li>
              <li><strong>Legal Obligations:</strong> Some data may be retained longer if required by law (e.g., financial records, dispute resolution)</li>
            </ul>
          </section>

          {/* Security */}
          <section>
            <h2 className="text-2xl font-semibold text-cream mb-4">9. Security Measures</h2>
            <p>We implement industry-standard security practices:</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Encryption:</strong> AES-256 at rest, TLS 1.3 in transit</li>
              <li><strong>Authentication:</strong> JWT tokens with secure hashing (bcrypt)</li>
              <li><strong>Access Control:</strong> Row-Level Security (RLS) on all database tables</li>
              <li><strong>PII Tokenization:</strong> Sensitive data tokenized before storage</li>
              <li><strong>Regular Audits:</strong> Automated security scanning and manual code reviews</li>
              <li><strong>Incident Response:</strong> 72-hour breach notification timeline (GDPR Article 33)</li>
            </ul>
            <p className="mt-4">
              See our <a href="/security" className="text-burgundy hover:underline">Security Overview</a> for technical details.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-semibold text-cream mb-4">10. Cookies and Tracking</h2>
            <p>We use the following cookies:</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Essential Cookies:</strong> Authentication tokens, session management (cannot be disabled)</li>
              <li><strong>Analytics Cookies:</strong> Usage statistics, feature adoption (can be disabled in Settings)</li>
            </ul>
            <p className="mt-4">
              We do NOT use third-party advertising cookies or tracking pixels.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-semibold text-cream mb-4">11. Children's Privacy</h2>
            <p>
              Our Service is not intended for children under 13 (or 16 in the EU). We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us immediately, and we will delete it.
            </p>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-2xl font-semibold text-cream mb-4">12. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of any material changes by:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Email notification (if you've opted in)</li>
              <li>Prominent notice on the platform</li>
              <li>Updating the "Last Updated" date at the top of this page</li>
            </ul>
            <p className="mt-4">
              Continued use of the Service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-cream mb-4">13. Contact Us</h2>
            <p>For privacy-related questions or to exercise your rights:</p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Email:</strong> privacy@basslinepilates.com</li>
              <li><strong>Data Protection Officer:</strong> Available upon request</li>
              <li><strong>Supervisory Authority:</strong> You have the right to lodge a complaint with your local data protection authority</li>
            </ul>
          </section>
        </div>

        {/* Back Button */}
        <div className="mt-8 pt-6 border-t border-cream/10">
          <button
            onClick={() => window.history.back()}
            className="text-burgundy hover:text-burgundy/80 font-semibold underline"
          >
            ← Back to Settings
          </button>
        </div>
      </div>
    </div>
  );
}
