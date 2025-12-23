import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, type RegistrationData } from '../context/AuthContext';
import { CountrySelect } from '../components/ui/CountrySelect';

// Password validation helper
const validatePassword = (password: string) => {
  return {
    minLength: password.length >= 8,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasDigit: /\d/.test(password),
    hasSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
};

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [genderIdentity, setGenderIdentity] = useState('');
  const [country, setCountry] = useState('');
  const [pilatesExperience, setPilatesExperience] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [acceptedBetaTerms, setAcceptedBetaTerms] = useState(false);
  const [safetyConfirmed, setSafetyConfirmed] = useState(false);
  const [error, setError] = useState('');
  const [safetyError, setSafetyError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  const { register } = useAuth();

  // Check password requirements in real-time
  const passwordRequirements = validatePassword(password);
  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

  const handleGoalToggle = (goal: string) => {
    setGoals(prev =>
      prev.includes(goal)
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSafetyError(null);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (!isPasswordValid) {
      setError('Password must meet all security requirements');
      setShowPasswordRequirements(true);
      return;
    }

    // Validate safety confirmation
    if (!safetyConfirmed) {
      setSafetyError('Please confirm you are 16+ and have appropriate clearance before continuing.');
      return;
    }

    // Validate legal acceptance
    if (!acceptedPrivacy || !acceptedBetaTerms) {
      setError('You must accept the Privacy Policy and Beta Agreement to register');
      return;
    }

    setLoading(true);

    try {
      const registrationData: RegistrationData = {
        email,
        password,
        fullName: fullName || undefined,
        ageRange: ageRange || undefined,
        genderIdentity: genderIdentity || undefined,
        country: country || undefined,
        pilatesExperience: pilatesExperience || undefined,
        goals: goals.length > 0 ? goals : undefined,
        accepted_privacy_at: new Date().toISOString(),
        accepted_beta_terms_at: new Date().toISOString()
      };

      await register(registrationData);

      // Show success message (email confirmation required)
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Success state - show email confirmation message
  if (success) {
    return (
      <div className="min-h-screen bg-burgundy flex items-center justify-center p-4">
        <div className="bg-cream rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-burgundy mb-4">Check Your Email!</h1>
          <p className="text-charcoal mb-6">
            We've sent a confirmation email to <strong>{email}</strong>. Please click the link in the email to verify your account before logging in.
          </p>

          <div className="bg-burgundy/10 border border-burgundy/20 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-charcoal mb-2 font-semibold">Next steps:</p>
            <ol className="text-sm text-charcoal space-y-1 list-decimal list-inside">
              <li>Check your inbox (and spam folder)</li>
              <li>Click the confirmation link in the email</li>
              <li>Return here to log in</li>
            </ol>
          </div>

          <Link
            to="/login"
            className="inline-block bg-burgundy text-cream px-6 py-2 rounded hover:bg-burgundy/90 font-semibold"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-burgundy flex items-center justify-center p-4">
      <div className="bg-cream rounded-lg shadow-xl p-8 max-w-2xl w-full">
        <h1 className="text-3xl font-bold text-burgundy mb-2 text-center">Create Account</h1>
        <p className="text-charcoal/70 text-sm text-center mb-6">
          Help us personalise your Pilates experience
        </p>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm text-red-700 font-medium">{error}</p>
                {error.toLowerCase().includes('rate limit') && (
                  <div className="mt-2 text-xs text-red-600 space-y-1">
                    <p className="font-semibold">What you can do:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Wait 1-2 hours before trying again</li>
                      <li>Try a different email address</li>
                      <li>Try from a different network (mobile data/VPN)</li>
                      <li>Clear browser cache and cookies</li>
                    </ul>
                    <p className="mt-2 italic">This is a Supabase security measure to prevent abuse. Your patience is appreciated!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Basic Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-burgundy border-b border-burgundy/20 pb-2">
              Account Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-charcoal mb-1">
                  Full Name <span className="text-charcoal/50">(optional)</span>
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-2 border border-charcoal/20 rounded focus:outline-none focus:ring-2 focus:ring-burgundy"
                  placeholder="Jane Doe"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-charcoal/20 rounded focus:outline-none focus:ring-2 focus:ring-burgundy"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-charcoal mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setShowPasswordRequirements(true)}
                  required
                  className="w-full px-4 py-2 border border-charcoal/20 rounded focus:outline-none focus:ring-2 focus:ring-burgundy"
                  placeholder="••••••••"
                />

                {/* Password Requirements Checklist */}
                {(showPasswordRequirements || password.length > 0) && (
                  <div className="mt-2 p-3 bg-charcoal/5 border border-charcoal/10 rounded text-xs space-y-1.5">
                    <p className="font-semibold text-charcoal mb-2">Password must contain:</p>

                    <div className="flex items-center gap-2">
                      <span className={passwordRequirements.minLength ? 'text-green-600' : 'text-charcoal/50'}>
                        {passwordRequirements.minLength ? '✓' : '○'}
                      </span>
                      <span className={passwordRequirements.minLength ? 'text-green-600 font-medium' : 'text-charcoal/70'}>
                        At least 8 characters
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={passwordRequirements.hasLowercase ? 'text-green-600' : 'text-charcoal/50'}>
                        {passwordRequirements.hasLowercase ? '✓' : '○'}
                      </span>
                      <span className={passwordRequirements.hasLowercase ? 'text-green-600 font-medium' : 'text-charcoal/70'}>
                        At least one lowercase letter (a-z)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={passwordRequirements.hasUppercase ? 'text-green-600' : 'text-charcoal/50'}>
                        {passwordRequirements.hasUppercase ? '✓' : '○'}
                      </span>
                      <span className={passwordRequirements.hasUppercase ? 'text-green-600 font-medium' : 'text-charcoal/70'}>
                        At least one uppercase letter (A-Z)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={passwordRequirements.hasDigit ? 'text-green-600' : 'text-charcoal/50'}>
                        {passwordRequirements.hasDigit ? '✓' : '○'}
                      </span>
                      <span className={passwordRequirements.hasDigit ? 'text-green-600 font-medium' : 'text-charcoal/70'}>
                        At least one digit (0-9)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={passwordRequirements.hasSymbol ? 'text-green-600' : 'text-charcoal/50'}>
                        {passwordRequirements.hasSymbol ? '✓' : '○'}
                      </span>
                      <span className={passwordRequirements.hasSymbol ? 'text-green-600 font-medium' : 'text-charcoal/70'}>
                        At least one symbol (!@#$%^&*...)
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-charcoal mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-charcoal/20 rounded focus:outline-none focus:ring-2 focus:ring-burgundy"
                  placeholder="••••••••"
                />
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <span>✗</span> Passwords do not match
                  </p>
                )}
                {confirmPassword && password === confirmPassword && password.length > 0 && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <span>✓</span> Passwords match
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-burgundy border-b border-burgundy/20 pb-2">
              About You <span className="text-sm font-normal text-charcoal/60"></span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="ageRange" className="block text-sm font-medium text-charcoal mb-1">
                  Age Range
                </label>
                <select
                  id="ageRange"
                  value={ageRange}
                  onChange={(e) => setAgeRange(e.target.value)}
                  className="w-full px-4 py-2 border border-charcoal/20 rounded focus:outline-none focus:ring-2 focus:ring-burgundy bg-white"
                >
                  <option value="">Select age range</option>
                  <option value="18-24">18-24</option>
                  <option value="25-34">25-34</option>
                  <option value="35-44">35-44</option>
                  <option value="45-54">45-54</option>
                  <option value="55-64">55-64</option>
                  <option value="65+">65+</option>
                </select>
              </div>

              <div>
                <label htmlFor="genderIdentity" className="block text-sm font-medium text-charcoal mb-1">
                  Gender Identity
                </label>
                <select
                  id="genderIdentity"
                  value={genderIdentity}
                  onChange={(e) => setGenderIdentity(e.target.value)}
                  className="w-full px-4 py-2 border border-charcoal/20 rounded focus:outline-none focus:ring-2 focus:ring-burgundy bg-white"
                >
                  <option value="">Select gender identity</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-charcoal mb-1">
                  Country
                </label>
                <CountrySelect
                  value={country}
                  onChange={setCountry}
                  className="w-full px-4 py-2 border border-charcoal/20 rounded focus:outline-none focus:ring-2 focus:ring-burgundy"
                  placeholder="Select or type country"
                />
              </div>

              <div>
                <label htmlFor="pilatesExperience" className="block text-sm font-medium text-charcoal mb-1">
                  Pilates Experience
                </label>
                <select
                  id="pilatesExperience"
                  value={pilatesExperience}
                  onChange={(e) => setPilatesExperience(e.target.value)}
                  className="w-full px-4 py-2 border border-charcoal/20 rounded focus:outline-none focus:ring-2 focus:ring-burgundy bg-white"
                >
                  <option value="">Select experience level</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                  <option value="Instructor">Instructor</option>
                </select>
              </div>
            </div>
          </div>

          {/* Goals */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-burgundy border-b border-burgundy/20 pb-2">
              Your Goals <span className="text-sm font-normal text-charcoal/60">(select all that apply)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <label className="flex items-center space-x-3 p-3 border border-charcoal/20 rounded cursor-pointer hover:bg-burgundy/5 transition-colors">
                <input
                  type="checkbox"
                  checked={goals.includes('stress_relief')}
                  onChange={() => handleGoalToggle('stress_relief')}
                  className="w-5 h-5 text-burgundy focus:ring-burgundy border-charcoal/30 rounded"
                />
                <div>
                  <div className="font-medium text-charcoal">Stress Relief</div>
                  <div className="text-xs text-charcoal/60">Relaxation and mindfulness</div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 border border-charcoal/20 rounded cursor-pointer hover:bg-burgundy/5 transition-colors">
                <input
                  type="checkbox"
                  checked={goals.includes('tone_strength')}
                  onChange={() => handleGoalToggle('tone_strength')}
                  className="w-5 h-5 text-burgundy focus:ring-burgundy border-charcoal/30 rounded"
                />
                <div>
                  <div className="font-medium text-charcoal">Tone & Strength</div>
                  <div className="text-xs text-charcoal/60">Build muscle and definition</div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 border border-charcoal/20 rounded cursor-pointer hover:bg-burgundy/5 transition-colors">
                <input
                  type="checkbox"
                  checked={goals.includes('performance')}
                  onChange={() => handleGoalToggle('performance')}
                  className="w-5 h-5 text-burgundy focus:ring-burgundy border-charcoal/30 rounded"
                />
                <div>
                  <div className="font-medium text-charcoal">Performance</div>
                  <div className="text-xs text-charcoal/60">Athletic enhancement</div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 border border-charcoal/20 rounded cursor-pointer hover:bg-burgundy/5 transition-colors">
                <input
                  type="checkbox"
                  checked={goals.includes('habit_building')}
                  onChange={() => handleGoalToggle('habit_building')}
                  className="w-5 h-5 text-burgundy focus:ring-burgundy border-charcoal/30 rounded"
                />
                <div>
                  <div className="font-medium text-charcoal">Habit Building</div>
                  <div className="text-xs text-charcoal/60">Consistent practice routine</div>
                </div>
              </label>
            </div>
          </div>

          {/* Important Health & Age Guidance */}
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
            <h3 className="font-bold text-amber-900 mb-3">
              Important Health & Age Guidance
            </h3>
            <p className="text-sm text-amber-900 mb-2">
              This programme is intended for users <strong>aged 16 and over</strong>.
            </p>
            <p className="text-sm text-amber-900 mb-2">
              It is not suitable without professional clearance if any of the following apply to you:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-amber-900 mb-3">
              <li>You are <strong>pregnant beyond the first trimester</strong></li>
              <li>You have <strong>given birth within the last 12 weeks</strong></li>
              <li>You have been diagnosed with <strong>abdominal separation (diastasis recti)</strong></li>
            </ul>
            <p className="text-sm text-amber-900 mb-2">
              If any of the above apply, please seek guidance from your <strong>GP, obstetrician, midwife, or women's health physiotherapist</strong> before using this app.
            </p>
            <p className="text-sm text-amber-900 mb-2">
              For postnatal users, a minimum of <strong>12 weeks postpartum</strong> and completion of your <strong>12-week postnatal check</strong> is required before beginning this programme.
            </p>
            <p className="text-sm text-amber-900 font-medium">
              Starting too early or without appropriate clearance may place unnecessary strain on the pelvic floor or abdominal wall.
            </p>
          </div>

          {/* Safety Confirmation Checkbox */}
          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={safetyConfirmed}
                onChange={(e) => {
                  setSafetyConfirmed(e.target.checked);
                  if (e.target.checked) setSafetyError(null);
                }}
                className="mt-1 h-4 w-4 text-burgundy focus:ring-burgundy border-gray-300 rounded"
              />
              <span className="text-sm text-charcoal">
                I confirm that I am <strong>16 years of age or older</strong>, and that none of the above conditions apply to me <strong>(or I have appropriate medical clearance)</strong>.
              </span>
            </label>
            {safetyError && (
              <p className="text-sm text-red-600 ml-7">{safetyError}</p>
            )}
          </div>

          {/* Legal Agreements - Required */}
          <div className="space-y-3 pt-4 border-t border-charcoal/20">
            <h2 className="text-lg font-semibold text-burgundy">
              Legal Agreements <span className="text-red-500">*</span>
            </h2>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedPrivacy}
                onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                className="mt-1 w-5 h-5 text-burgundy focus:ring-burgundy border-charcoal/30 rounded"
                required
              />
              <span className="text-sm text-charcoal">
                I have read and agree to the{' '}
                <Link to="/privacy" target="_blank" className="text-burgundy hover:underline font-medium">
                  Privacy Policy
                </Link>
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptedBetaTerms}
                onChange={(e) => setAcceptedBetaTerms(e.target.checked)}
                className="mt-1 w-5 h-5 text-burgundy focus:ring-burgundy border-charcoal/30 rounded"
                required
              />
              <span className="text-sm text-charcoal">
                I have read and agree to the{' '}
                <Link to="/beta-agreement" target="_blank" className="text-burgundy hover:underline font-medium">
                  Beta Tester Agreement
                </Link>
                {' '}and{' '}
                <Link to="/safety" target="_blank" className="text-burgundy hover:underline font-medium">
                  Health & Safety Disclaimer
                </Link>
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading || !acceptedPrivacy || !acceptedBetaTerms || !safetyConfirmed}
            className="w-full bg-burgundy text-cream py-3 rounded font-semibold hover:bg-burgundy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth mt-6"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-charcoal">
          Already have an account?{' '}
          <Link to="/login" className="text-burgundy hover:underline font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
