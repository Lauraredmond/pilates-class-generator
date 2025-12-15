/**
 * Security Overview Page
 * Technical security practices and infrastructure details
 */

export function Security() {
  return (
    <div className="min-h-screen bg-burgundy py-12 px-4">
      <div className="max-w-4xl mx-auto bg-charcoal rounded-lg p-8 border-2 border-cream/10">
        <h1 className="text-4xl font-bold text-cream mb-6">Security Overview</h1>
        <p className="text-cream/60 text-sm mb-8">Last Updated: December 15, 2025</p>

        <div className="prose prose-invert prose-cream max-w-none space-y-6 text-cream/90">
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-cream mb-4">Our Security Commitment</h2>
            <p>
              Bassline Pilates takes security seriously. This page provides technical details about our security practices, infrastructure, and compliance measures.
            </p>
          </section>

          {/* Infrastructure */}
          <section>
            <h2 className="text-2xl font-semibold text-cream mb-4">1. Infrastructure Security</h2>

            <h3 className="text-xl font-semibold text-cream mb-3">1.1 User Data Storage (Supabase - EU)</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Location:</strong> EU data centers (Frankfurt, Germany region)</li>
              <li><strong>Encryption at Rest:</strong> AES-256 encryption for all stored data</li>
              <li><strong>Encryption in Transit:</strong> TLS 1.3 for all network connections</li>
              <li><strong>Access Control:</strong> Row-Level Security (RLS) policies on all tables</li>
              <li><strong>Backup:</strong> Automated daily backups with point-in-time recovery</li>
              <li><strong>Compliance:</strong> GDPR-compliant, SOC 2 Type II certified infrastructure</li>
            </ul>

            <h3 className="text-xl font-semibold text-cream mb-3 mt-6">1.2 Video Content Delivery (AWS CloudFront/S3 - US)</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Content Type:</strong> Pre-recorded Pilates demonstration videos (Bassline-created educational content)</li>
              <li><strong>No User Data:</strong> Zero user-generated content, zero personal information</li>
              <li><strong>Storage:</strong> AWS S3 with private bucket access (not publicly listable)</li>
              <li><strong>Delivery:</strong> AWS CloudFront CDN with HTTPS-only distribution</li>
              <li><strong>Cache Headers:</strong> 1-year immutable caching for performance</li>
              <li><strong>Access Control:</strong> CloudFront origin access identity (OAI) restricts direct S3 access</li>
            </ul>

            <h3 className="text-xl font-semibold text-cream mb-3 mt-6">1.3 API & Application Hosting</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Frontend:</strong> Netlify (static site hosting, global CDN, DDoS protection)</li>
              <li><strong>Backend API:</strong> Render (auto-scaling, health checks, zero-downtime deployments)</li>
              <li><strong>All Traffic:</strong> HTTPS-only with HSTS headers (strict transport security)</li>
              <li><strong>Firewall:</strong> Web Application Firewall (WAF) protection</li>
            </ul>
          </section>

          {/* Authentication */}
          <section>
            <h2 className="text-2xl font-semibold text-cream mb-4">2. Authentication & Authorization</h2>

            <h3 className="text-xl font-semibold text-cream mb-3">2.1 Password Security</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Hashing:</strong> bcrypt with salt (industry-standard, resistant to rainbow tables)</li>
              <li><strong>Minimum Requirements:</strong> 8 characters minimum (users encouraged to use 12+ with complexity)</li>
              <li><strong>Storage:</strong> Passwords never stored in plain text, only hashed</li>
              <li><strong>Reset:</strong> Secure password reset flow with time-limited tokens</li>
            </ul>

            <h3 className="text-xl font-semibold text-cream mb-3 mt-6">2.2 Session Management</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Tokens:</strong> JWT (JSON Web Tokens) with HMAC-SHA256 signing</li>
              <li><strong>Expiration:</strong> Access tokens expire after 1 hour, refresh tokens after 7 days</li>
              <li><strong>Revocation:</strong> Tokens invalidated immediately upon logout or account deletion</li>
              <li><strong>Storage:</strong> Tokens stored in httpOnly cookies (not accessible to JavaScript, XSS-resistant)</li>
            </ul>

            <h3 className="text-xl font-semibold text-cream mb-3 mt-6">2.3 Authorization</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Row-Level Security (RLS):</strong> Users can only access their own data</li>
              <li><strong>API Authentication:</strong> All API endpoints require valid JWT tokens</li>
              <li><strong>Admin Privileges:</strong> Separate admin role for AI agent access (cost control)</li>
            </ul>
          </section>

          {/* Data Protection */}
          <section>
            <h2 className="text-2xl font-semibold text-cream mb-4">3. Data Protection Measures</h2>

            <h3 className="text-xl font-semibold text-cream mb-3">3.1 PII Tokenization</h3>
            <p>
              Personally Identifiable Information (PII) is tokenized before storage:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Email addresses encrypted with AES-256</li>
              <li>Tokens stored separately from user records</li>
              <li>Decryption only occurs when displaying data to the account owner</li>
            </ul>

            <h3 className="text-xl font-semibold text-cream mb-3 mt-6">3.2 Data Minimization</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>We only collect data necessary for service functionality</li>
              <li>Optional fields remain optional (biography, profile details)</li>
              <li>No tracking of location, biometrics, or sensitive health data</li>
            </ul>

            <h3 className="text-xl font-semibold text-cream mb-3 mt-6">3.3 Data Deletion</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Account Deletion:</strong> Cascading deletion of all related data</li>
              <li><strong>Timeline:</strong> Complete erasure within 30 days</li>
              <li><strong>Verification:</strong> Password required to prevent accidental deletion</li>
              <li><strong>Logs:</strong> Audit trail for GDPR compliance (Article 17)</li>
            </ul>
          </section>

          {/* Application Security */}
          <section>
            <h2 className="text-2xl font-semibold text-cream mb-4">4. Application Security</h2>

            <h3 className="text-xl font-semibold text-cream mb-3">4.1 Content Security Policy (CSP)</h3>
            <p>
              Strict CSP headers prevent XSS attacks and unauthorized resource loading:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>script-src:</strong> Only allow scripts from our domain and Internet Archive</li>
              <li><strong>media-src:</strong> Only allow media from trusted CDNs (archive.org, cloudfront.net, Supabase)</li>
              <li><strong>connect-src:</strong> Only allow API calls to our backend and Supabase</li>
              <li><strong>frame-src:</strong> No iframes allowed (prevents clickjacking)</li>
            </ul>

            <h3 className="text-xl font-semibold text-cream mb-3 mt-6">4.2 XSS Protection</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>React's built-in XSS protection (automatic escaping)</li>
              <li>Content Security Policy (CSP) headers</li>
              <li>X-XSS-Protection header for legacy browsers</li>
              <li>Input validation on all user-provided data</li>
            </ul>

            <h3 className="text-xl font-semibold text-cream mb-3 mt-6">4.3 CSRF Protection</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>SameSite cookie attribute (strict)</li>
              <li>CORS policy restricts cross-origin requests</li>
              <li>JWT tokens in httpOnly cookies</li>
            </ul>

            <h3 className="text-xl font-semibold text-cream mb-3 mt-6">4.4 SQL Injection Protection</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Parameterized queries (never string concatenation)</li>
              <li>ORM layer (Supabase client) prevents direct SQL access</li>
              <li>Row-Level Security (RLS) provides additional protection</li>
            </ul>
          </section>

          {/* Monitoring */}
          <section>
            <h2 className="text-2xl font-semibold text-cream mb-4">5. Security Monitoring</h2>

            <h3 className="text-xl font-semibold text-cream mb-3">5.1 Automated Scanning</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Dependency Scanning:</strong> GitHub Dependabot alerts for vulnerable packages</li>
              <li><strong>SAST:</strong> Static Application Security Testing on every commit</li>
              <li><strong>Secret Scanning:</strong> Automated detection of accidentally committed secrets</li>
            </ul>

            <h3 className="text-xl font-semibold text-cream mb-3 mt-6">5.2 Logging & Auditing</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>PII Transactions:</strong> All PII access logged to `ropa_audit_log` table</li>
              <li><strong>AI Decisions:</strong> All AI-generated class plans logged (EU AI Act compliance)</li>
              <li><strong>Authentication:</strong> Login attempts, password changes, account deletions logged</li>
              <li><strong>Retention:</strong> Security logs retained for 2 years, then auto-deleted</li>
            </ul>

            <h3 className="text-xl font-semibold text-cream mb-3 mt-6">5.3 Incident Response</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Detection:</strong> Automated alerts for suspicious activity</li>
              <li><strong>Response Time:</strong> 72-hour breach notification (GDPR Article 33)</li>
              <li><strong>Communication:</strong> Affected users notified within 72 hours</li>
              <li><strong>Remediation:</strong> Immediate action to contain and resolve security incidents</li>
            </ul>
          </section>

          {/* Third-Party Security */}
          <section>
            <h2 className="text-2xl font-semibold text-cream mb-4">6. Third-Party Service Security</h2>

            <h3 className="text-xl font-semibold text-cream mb-3">6.1 AI Processing (OpenAI)</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Data Sent:</strong> Only class preferences (difficulty, duration, focus) - NO personal identifiers</li>
              <li><strong>Retention:</strong> OpenAI retains for 30 days (abuse monitoring), then deleted</li>
              <li><strong>Compliance:</strong> SOC 2 Type II certified, GDPR-compliant</li>
              <li><strong>Control:</strong> Users can disable AI mode entirely (Settings → AI Class Generation)</li>
            </ul>

            <h3 className="text-xl font-semibold text-cream mb-3 mt-6">6.2 Video Hosting (AWS S3/CloudFront)</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Content:</strong> Only Bassline-created educational videos (no user data)</li>
              <li><strong>Bucket Security:</strong> Private buckets, not publicly listable</li>
              <li><strong>Access:</strong> CloudFront OAI prevents direct S3 URL access</li>
              <li><strong>Compliance:</strong> SOC 2, ISO 27001, PCI DSS Level 1 certified infrastructure</li>
            </ul>

            <h3 className="text-xl font-semibold text-cream mb-3 mt-6">6.3 Music Streaming (Internet Archive)</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Content:</strong> Public domain classical music</li>
              <li><strong>Privacy:</strong> Direct streaming, no tracking or user identification</li>
              <li><strong>No Data Collection:</strong> Internet Archive does not receive user information from us</li>
            </ul>
          </section>

          {/* Compliance */}
          <section>
            <h2 className="text-2xl font-semibold text-cream mb-4">7. Compliance & Certifications</h2>

            <h3 className="text-xl font-semibold text-cream mb-3">7.1 GDPR Compliance</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Data Residency:</strong> User data stored in EU (Supabase Frankfurt)</li>
              <li><strong>User Rights:</strong> Full GDPR rights implementation (access, rectification, erasure, portability)</li>
              <li><strong>Lawful Basis:</strong> Consent and legitimate interests</li>
              <li><strong>DPO:</strong> Data Protection Officer available upon request</li>
            </ul>

            <h3 className="text-xl font-semibold text-cream mb-3 mt-6">7.2 EU AI Act Compliance</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Transparency:</strong> All AI decisions logged with reasoning</li>
              <li><strong>Human Oversight:</strong> Users can review and override AI recommendations</li>
              <li><strong>Bias Monitoring:</strong> Automated tracking of AI model drift and fairness metrics</li>
              <li><strong>Documentation:</strong> AI decision history available in Settings → Data, Privacy & Compliance</li>
            </ul>

            <h3 className="text-xl font-semibold text-cream mb-3 mt-6">7.3 Infrastructure Certifications</h3>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Supabase:</strong> SOC 2 Type II, GDPR-compliant</li>
              <li><strong>AWS:</strong> SOC 1/2/3, ISO 27001, PCI DSS Level 1, HIPAA-eligible</li>
              <li><strong>Netlify:</strong> SOC 2 Type II, GDPR-compliant</li>
              <li><strong>OpenAI:</strong> SOC 2 Type II, GDPR-compliant</li>
            </ul>
          </section>

          {/* Reporting */}
          <section>
            <h2 className="text-2xl font-semibold text-cream mb-4">8. Security Vulnerability Reporting</h2>
            <p>
              If you discover a security vulnerability, please report it responsibly:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li><strong>Email:</strong> security@basslinepilates.com</li>
              <li><strong>Response Time:</strong> We aim to respond within 48 hours</li>
              <li><strong>Bug Bounty:</strong> Not currently offered (beta phase)</li>
              <li><strong>Responsible Disclosure:</strong> Please allow us 90 days to remediate before public disclosure</li>
            </ul>
          </section>

          {/* Updates */}
          <section>
            <h2 className="text-2xl font-semibold text-cream mb-4">9. Security Updates</h2>
            <p>
              We continuously improve our security posture:
            </p>
            <ul className="list-disc list-inside ml-4 space-y-2">
              <li>Monthly security patches for dependencies</li>
              <li>Quarterly security audits</li>
              <li>Continuous monitoring for emerging threats</li>
              <li>Regular penetration testing (before production launch)</li>
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
