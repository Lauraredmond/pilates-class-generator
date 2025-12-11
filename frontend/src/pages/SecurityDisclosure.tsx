/**
 * Security Disclosure Page
 * Displays Bassline Pilates Security Disclosure Note
 */

import { useNavigate } from 'react-router-dom';

export function SecurityDisclosure() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-burgundy py-12 px-4">
      <div className="max-w-4xl mx-auto bg-cream rounded-lg shadow-xl p-8 md:p-12">
        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate(-1)} className="text-burgundy hover:underline text-sm mb-4 inline-block">
            ← Back
          </button>
          <h1 className="text-4xl font-semibold text-burgundy mb-2">Security Disclosure Note</h1>
          <p className="text-charcoal/70 text-lg">
            Understanding how we protect your data
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-burgundy max-w-none space-y-6 text-charcoal">
          <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
            <p>
              Thank you for testing the Bassline Pilates beta. We want you to feel confident that your data and your device are safe while using the app. Below is an explanation of the security steps we've taken and what you should know as a tester.
            </p>
          </div>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">1. What We Tested</h2>
            <p>
              Before inviting testers, Bassline Pilates underwent a structured security review aligned to the key 2025 OWASP Top Risk Categories. Our testing covered the following areas:
            </p>

            <div className="space-y-4 mt-4">
              <div className="bg-burgundy/5 p-4 rounded">
                <h3 className="font-semibold text-burgundy mb-2">• Automated Scanning (OWASP ZAP)</h3>
                <p className="text-sm">Scanned the public-facing app for common vulnerabilities such as broken access control, injection issues, and misconfigurations.</p>
              </div>

              <div className="bg-burgundy/5 p-4 rounded">
                <h3 className="font-semibold text-burgundy mb-2">• Dependency & Supply Chain Security (AuditNOM, GitGuardian)</h3>
                <ul className="text-sm list-disc pl-6">
                  <li>Reviewed npm packages for known vulnerabilities.</li>
                  <li>Detected malicious or outdated dependencies.</li>
                  <li>Ensured no API keys, secrets, or credentials were exposed in the repository.</li>
                </ul>
              </div>

              <div className="bg-burgundy/5 p-4 rounded">
                <h3 className="font-semibold text-burgundy mb-2">• Authentication & Authorization</h3>
                <ul className="text-sm list-disc pl-6">
                  <li>Verified session handling, login security, and access restrictions.</li>
                  <li>Ensured users can access only their own data.</li>
                </ul>
              </div>

              <div className="bg-burgundy/5 p-4 rounded">
                <h3 className="font-semibold text-burgundy mb-2">• Database Security (Supabase RLS)</h3>
                <ul className="text-sm list-disc pl-6">
                  <li>Confirmed Row Level Security rules properly isolate user data.</li>
                  <li>Reviewed policy logic for correctness and least‑privilege access.</li>
                </ul>
              </div>

              <div className="bg-burgundy/5 p-4 rounded">
                <h3 className="font-semibold text-burgundy mb-2">• Input Validation & Injection Protection</h3>
                <p className="text-sm">Checked for unsafe handling of user input that could allow SQL injection, XSS, or logic bypass.</p>
              </div>

              <div className="bg-burgundy/5 p-4 rounded">
                <h3 className="font-semibold text-burgundy mb-2">• Cryptography & Secrets Management</h3>
                <ul className="text-sm list-disc pl-6">
                  <li>Confirmed that all traffic uses HTTPS.</li>
                  <li>Verified password hashing and secure credential storage in environment variables.</li>
                </ul>
              </div>

              <div className="bg-burgundy/5 p-4 rounded">
                <h3 className="font-semibold text-burgundy mb-2">• Logging & Error Handling</h3>
                <ul className="text-sm list-disc pl-6">
                  <li>Ensured logs do not contain sensitive data.</li>
                  <li>Checked that error messages do not leak internal information.</li>
                </ul>
              </div>

              <div className="bg-burgundy/5 p-4 rounded">
                <h3 className="font-semibold text-burgundy mb-2">• Business Logic & Insecure Design</h3>
                <p className="text-sm">Reviewed app flows to identify places where users could bypass intended restrictions or misuse features.</p>
              </div>

              <div className="bg-burgundy/5 p-4 rounded">
                <h3 className="font-semibold text-burgundy mb-2">• Frontend Security Hardening</h3>
                <ul className="text-sm list-disc pl-6">
                  <li>Ensured user-generated content is not injected as HTML.</li>
                  <li>Reviewed React components to reduce XSS risks.</li>
                </ul>
              </div>
            </div>

            <p className="font-medium mt-4">
              In addition, <strong>Wireshark packet analysis</strong> was performed to confirm that no personal data is transmitted in clear text over the network.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">2. What These Tests Mean for You</h2>
            <p>
              These checks help identify issues early and improve the safety of your testing experience. They do not guarantee perfect security, but they demonstrate that Bassline Pilates is being built with strong, modern security practices.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">3. What Bassline Pilates Does NOT Do</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>We do not sell or rent your data.</li>
              <li>We do not use third‑party advertising or behavioural tracking.</li>
              <li>We do not collect sensitive health data such as injuries or medical history.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">4. What You Should Know as a Tester</h2>
            <p>Because this is a beta:</p>
            <ul className="list-disc pl-6">
              <li>Bugs may appear.</li>
              <li>Features may behave inconsistently.</li>
              <li>Data may be reset during updates.</li>
              <li>Security controls will continue to evolve.</li>
            </ul>
            <p className="font-medium mt-3">
              Please report anything unusual to: <a href="mailto:laura.redm@gmail.com" className="text-burgundy hover:underline">laura.redm@gmail.com</a> or via the feedback link on the application settings page.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">5. How Your Data Is Stored</h2>
            <p>All core data is stored in the EU:</p>
            <ul className="list-disc pl-6">
              <li>Supabase (Ireland – eu-west-1)</li>
              <li>Render Backend (Germany – eu-central-1)</li>
              <li>Resend Email Infrastructure (EU region, with limited metadata potentially processed in US under standard contractual clauses)</li>
            </ul>
            <p className="text-sm italic mt-2">
              Netlify serves the static frontend globally but does not store user data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">6. Your Responsibilities</h2>
            <ul className="list-disc pl-6">
              <li>Use a strong, unique password.</li>
              <li>Do not share screenshots or internal features publicly.</li>
              <li>Report issues or concerns quickly.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-burgundy mb-3">7. Contact</h2>
            <p>
              If you have questions, contact: <a href="mailto:laura.redm@gmail.com" className="text-burgundy hover:underline">laura.redm@gmail.com</a> or via the feedback link on the application settings page.
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
