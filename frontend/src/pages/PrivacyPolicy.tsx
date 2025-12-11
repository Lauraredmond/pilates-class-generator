/**
 * Privacy Policy Page
 * Displays Bassline Pilates Privacy Policy (Beta)
 */

import { Link } from 'react-router-dom';

export function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-burgundy py-12 px-4">
      <div className="max-w-4xl mx-auto bg-cream rounded-lg shadow-xl p-8 md:p-12">
        {/* Header */}
        <div className="mb-8">
          <Link to="/" className="text-burgundy hover:underline text-sm mb-4 inline-block">
            ← Back to Home
          </Link>
          <h1 className="text-4xl font-bold text-burgundy mb-2">Privacy Policy</h1>
          <p className="text-charcoal/60 text-sm">
            Last Updated: December 2025 | Status: Early Beta Version — Subject to Change
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-burgundy max-w-none space-y-6 text-charcoal">
          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">1. Introduction</h2>
            <p>
              Welcome to Bassline Pilates ("we", "our", "us"). We provide a personalised Pilates planning and training experience that adapts to your practise history, muscle-group usage, and preferences. Because this is a beta release, some features, controls, and protections are still evolving — but we take your privacy seriously and want you to understand exactly how your data is used and protected.
            </p>
            <p className="font-medium">This Privacy Policy explains:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>What data we collect</li>
              <li>Why we collect it</li>
              <li>How we store and protect it</li>
              <li>Who has access</li>
              <li>Your rights</li>
              <li>How to contact us</li>
            </ul>
            <p className="text-sm italic bg-burgundy/5 p-3 rounded border-l-4 border-burgundy">
              If you do not agree with this policy, please do not use the beta version of Bassline Pilates.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">2. What Data We Collect</h2>
            <p>We only collect the minimum data necessary to operate the beta, generate your personalised classes, and improve system performance.</p>

            <h3 className="text-xl font-semibold text-burgundy mt-4 mb-2">A. Account Information</h3>
            <ul className="list-disc pl-6">
              <li>Email address</li>
              <li>Encrypted password</li>
              <li>Account creation timestamps</li>
              <li>Age Range</li>
              <li>Gender Identity</li>
              <li>Country</li>
            </ul>

            <h3 className="text-xl font-semibold text-burgundy mt-4 mb-2">B. Profile & Training Preferences</h3>
            <ul className="list-disc pl-6">
              <li>Optional preference selections</li>
              <li>Pilates experience level</li>
            </ul>

            <h3 className="text-xl font-semibold text-burgundy mt-4 mb-2">C. Practice & Movement Data</h3>
            <p>We store:</p>
            <ul className="list-disc pl-6">
              <li>Movements used in each class</li>
              <li>Muscle groups activated per session</li>
              <li>Practise history</li>
              <li>Class generation parameters</li>
            </ul>

            <h3 className="text-xl font-semibold text-burgundy mt-4 mb-2">D. Device & Technical Information</h3>
            <p>Automatically collected:</p>
            <ul className="list-disc pl-6">
              <li>Browser type/version</li>
              <li>Operating system</li>
              <li>Device type</li>
              <li>IP address</li>
              <li>Basic usage analytics</li>
            </ul>

            <h3 className="text-xl font-semibold text-burgundy mt-4 mb-2">E. Diagnostic & Security Data</h3>
            <p>Collected to ensure safe functioning:</p>
            <ul className="list-disc pl-6">
              <li>Error logs</li>
              <li>System performance metrics</li>
              <li>Security scan metadata</li>
            </ul>

            <p className="font-medium text-sm bg-green-50 p-3 rounded border-l-4 border-green-500 mt-4">
              We do not collect biometric data, medical records, financial data, location data, or camera/microphone data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">3. How We Use Your Data</h2>
            <p>Used for:</p>
            <ul className="list-disc pl-6">
              <li>Class generation</li>
              <li>Tracking muscle engagement</li>
              <li>Improving accuracy and stability</li>
              <li>Security and account integrity</li>
            </ul>
            <p className="font-medium">We do not sell or share your data for advertising.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">4. Security Measures</h2>

            <h3 className="text-xl font-semibold text-burgundy mt-4 mb-2">A. Technical Protections</h3>
            <ul className="list-disc pl-6">
              <li>TLS encryption</li>
              <li>Password hashing</li>
              <li>Row-Level Security (RLS)</li>
              <li>Secure token handling</li>
              <li>Minimum password complexity standards</li>
            </ul>

            <h3 className="text-xl font-semibold text-burgundy mt-4 mb-2">B. Security Testing Performed</h3>
            <ul className="list-disc pl-6">
              <li>Claude Code static analysis</li>
              <li>GitGuardian secret detection</li>
              <li>OWASP ZAP baseline scan</li>
              <li>Supabase RLS audit</li>
              <li>Wireshark packet inspection (no PII leakage)</li>
            </ul>

            <h3 className="text-xl font-semibold text-burgundy mt-4 mb-2">C. Beta Limitations</h3>
            <ul className="list-disc pl-6">
              <li>Features may change</li>
              <li>Bugs may appear</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">5. Who Has Access to Your Data</h2>

            <h3 className="text-xl font-semibold text-burgundy mt-4 mb-2">A. Internal Access</h3>
            <p>Only the founder has access to error logs, anonymised analytics, and security alerts.</p>

            <h3 className="text-xl font-semibold text-burgundy mt-4 mb-2">B. Third-Party Providers</h3>
            <p>Supabase, Netlify, and Render process data only as needed.</p>

            <h3 className="text-xl font-semibold text-burgundy mt-4 mb-2">C. Data Residency</h3>
            <p>Bassline Pilates is designed to keep user data within the European Union wherever commercially and technically possible.</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Supabase (Primary Database & Authentication):</strong> All user account data, workout history, and analytics stored in Supabase are hosted in Ireland (eu-west-1).</li>
              <li><strong>Render (Backend Services):</strong> Backend API services are deployed in Frankfurt, Germany (eu-central-1). Data exchanged between Supabase and Render remains within the EU.</li>
              <li><strong>Netlify (Frontend Hosting):</strong> The application's frontend is served globally via CDN, but no personal data is stored or processed by Netlify. User data flows directly from the user's browser to Supabase in Ireland.</li>
              <li><strong>Resend (Transactional Email):</strong> Bassline Pilates uses Resend's EU email infrastructure (eu-west-1, Ireland) for sending verification and password-reset emails. Limited account-level metadata (e.g., delivery status logs) may be processed by Resend in the United States under Standard Contractual Clauses (SCCs).</li>
            </ul>
            <p className="italic text-sm">Overall, all core user data (identity, workout usage, preferences, history, and logs) is stored and processed exclusively within the EU, with only minimal email-delivery metadata potentially processed outside the EU using GDPR-approved safeguards.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">6. Data Retention</h2>
            <p>Retained for the beta duration unless deleted upon request.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">7. Your Rights</h2>
            <ul className="list-disc pl-6">
              <li>Access, delete, correct, export data</li>
              <li>Withdraw consent</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">8. Children's Privacy</h2>
            <p>Not intended for individuals under 16.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">9. Changes</h2>
            <p>We may update this policy. You will be notified of significant changes.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">10. Contact</h2>
            <p>
              Email: <a href="mailto:laura.redm@gmail.com" className="text-burgundy hover:underline">laura.redm@gmail.com</a> or the feedback link on the application settings page.
            </p>
            <p>Founder: Laura R.</p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-charcoal/20">
          <Link to="/" className="text-burgundy hover:underline font-medium">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
