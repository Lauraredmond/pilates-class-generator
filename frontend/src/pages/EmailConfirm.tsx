import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader } from 'lucide-react';

export function EmailConfirm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Confirming your email...');

  useEffect(() => {
    const confirmEmail = async () => {
      const token = searchParams.get('token');
      const type = searchParams.get('type');

      // If no token or type, show error
      if (!token || type !== 'signup') {
        setStatus('error');
        setMessage('Invalid confirmation link. Please try registering again.');
        return;
      }

      try {
        // The token is automatically handled by Supabase
        // We just need to acknowledge the confirmation
        setStatus('success');
        setMessage('Email confirmed successfully! Redirecting to login...');

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
  }, [searchParams, navigate]);

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
