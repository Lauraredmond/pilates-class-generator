import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const passwordRequirements: PasswordRequirement[] = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'At least one uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'At least one lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'At least one number', test: (p) => /[0-9]/.test(p) },
];

export function ResetPasswordConfirm() {
  // Parse token from URL hash fragment (Supabase uses #access_token=...)
  const getTokenFromHash = () => {
    const hash = window.location.hash.substring(1); // Remove '#'
    const params = new URLSearchParams(hash);
    return params.get('access_token') || params.get('token') || null;
  };

  const [token, setToken] = useState<string | null>(getTokenFromHash());

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { confirmPasswordReset } = useAuth();
  const navigate = useNavigate();

  // Monitor hash changes (in case token arrives after mount)
  useEffect(() => {
    const handleHashChange = () => {
      const newToken = getTokenFromHash();
      if (newToken && newToken !== token) {
        setToken(newToken);
        setError(''); // Clear any previous error
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [token]);

  // Check for token on mount
  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
    }
  }, [token]);

  const checkPasswordStrength = (password: string) => {
    return passwordRequirements.every(req => req.test(password));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate token exists
    if (!token) {
      setError('Invalid or missing reset token.');
      return;
    }

    // Validate password requirements
    if (!checkPasswordStrength(newPassword)) {
      setError('Password does not meet all requirements.');
      return;
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await confirmPasswordReset(token, newPassword);
      setSuccess(true);

      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may be expired.');
    } finally {
      setLoading(false);
    }
  };

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-burgundy flex items-center justify-center p-4">
        <div className="bg-cream rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-burgundy mb-4">Password Reset Successfully!</h1>
          <p className="text-charcoal mb-6">
            Your password has been updated. Redirecting to login page...
          </p>

          <Link
            to="/login"
            className="inline-block bg-burgundy text-cream px-6 py-2 rounded hover:bg-burgundy/90 font-semibold"
          >
            Go to Login Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-burgundy flex items-center justify-center p-4">
      <div className="bg-cream rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-burgundy mb-6 text-center">Set New Password</h1>

        <p className="text-charcoal mb-6 text-center">
          Enter your new password below. Make sure it meets all the requirements.
        </p>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password Field */}
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-charcoal mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={!token}
                className="w-full px-4 py-2 border border-charcoal/20 rounded focus:outline-none focus:ring-2 focus:ring-burgundy disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/60 hover:text-charcoal"
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-charcoal mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={!token}
              className="w-full px-4 py-2 border border-charcoal/20 rounded focus:outline-none focus:ring-2 focus:ring-burgundy disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="Confirm new password"
            />
          </div>

          {/* Password Requirements Checklist */}
          {newPassword && (
            <div className="bg-gray-50 rounded p-4 space-y-2">
              <p className="text-sm font-medium text-charcoal mb-2">Password Requirements:</p>
              {passwordRequirements.map((req, index) => {
                const isValid = req.test(newPassword);
                return (
                  <div key={index} className="flex items-center gap-2">
                    {isValid ? (
                      <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    <span className={`text-sm ${isValid ? 'text-green-700' : 'text-red-600'}`}>
                      {req.label}
                    </span>
                  </div>
                );
              })}
              {confirmPassword && (
                <div className="flex items-center gap-2">
                  {newPassword === confirmPassword ? (
                    <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                  <span className={`text-sm ${newPassword === confirmPassword ? 'text-green-700' : 'text-red-600'}`}>
                    Passwords match
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !token || !checkPasswordStrength(newPassword) || newPassword !== confirmPassword}
            className="w-full bg-burgundy text-cream py-3 rounded font-semibold hover:bg-burgundy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
          >
            {loading ? 'Resetting Password...' : 'Reset Password'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-charcoal">
          <Link to="/login" className="text-burgundy hover:underline font-medium">
            Back to Login
          </Link>
        </p>
      </div>
    </div>
  );
}
