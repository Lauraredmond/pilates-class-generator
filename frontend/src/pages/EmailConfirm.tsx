import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export function EmailConfirm() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirming your email...');

  useEffect(() => {
    const confirmEmail = async () => {
      // Parse token from URL hash fragment (Supabase uses #access_token=...)
      const hash = window.location.hash.substring(1); // Remove '#'
      const params = new URLSearchParams(hash);
      const token = params.get('access_token');
      const type = params.get('type');

      // If no token or wrong type, show error
      if (!token) {
        setStatus('error');
        setMessage('Invalid confirmation link. Please try registering again.');
        return;
      }

      // Check if this is a signup confirmation (not password recovery)
      if (type && type !== 'signup') {
        setStatus('error');
        setMessage('This link is not for email confirmation. Please check your email for the correct link.');
        return;
      }

      try {
        // Supabase automatically handles the confirmation when the link is clicked
        // The token in the URL confirms the email address
        setStatus('success');
        setMessage('Email confirmed successfully! You can now log in to your account.');

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage('Failed to confirm email. Please try again or contact support.');
      }
    };

    confirmEmail();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-burgundy flex items-center justify-center p-4">
      <div className="bg-cream rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader className="w-16 h-16 text-burgundy mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-bold text-burgundy mb-2">Confirming Email</h1>
            <p className="text-charcoal">{message}</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-burgundy mb-2">Email Confirmed!</h1>
            <p className="text-charcoal mb-4">{message}</p>
            <div className="text-sm text-charcoal/70">
              You will be redirected automatically, or{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-burgundy hover:underline font-medium"
              >
                click here to login now
              </button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-burgundy mb-2">Confirmation Failed</h1>
            <p className="text-charcoal mb-6">{message}</p>
            <button
              onClick={() => navigate('/register')}
              className="w-full bg-burgundy text-cream py-3 rounded font-semibold hover:bg-burgundy/90 transition-smooth"
            >
              Back to Registration
            </button>
          </>
        )}
      </div>
    </div>
  );
}
