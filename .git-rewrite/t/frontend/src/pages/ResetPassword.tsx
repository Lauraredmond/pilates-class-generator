import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ResetPassword() {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { requestPasswordReset } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await requestPasswordReset(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-burgundy flex items-center justify-center p-4">
        <div className="bg-cream rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-2xl font-bold text-burgundy mb-4">Check Your Email</h1>
          <p className="text-charcoal mb-6">
            If an account exists with <strong>{email}</strong>, you will receive a password reset link shortly.
          </p>

          <Link
            to="/login"
            className="inline-block bg-burgundy text-cream px-6 py-2 rounded hover:bg-burgundy/90 font-semibold"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-burgundy flex items-center justify-center p-4">
      <div className="bg-cream rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold text-burgundy mb-6 text-center">Reset Password</h1>

        <p className="text-charcoal mb-6 text-center">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-1">
              Email Address
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

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-burgundy text-cream py-3 rounded font-semibold hover:bg-burgundy/90 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
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
