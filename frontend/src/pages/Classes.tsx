import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Card, CardBody, CardTitle } from '../components/ui/Card';

type ViewType = 'main' | 'training';

export function Classes() {
  const [currentView, setCurrentView] = useState<ViewType>('main');
  const navigate = useNavigate();
  const { user } = useAuth();

  // Placeholder view component
  const PlaceholderView = ({ title }: { title: string }) => (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => setCurrentView('main')}
        className="flex items-center gap-2 text-cream/70 hover:text-cream mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Back to Training Hub</span>
      </button>

      <Card>
        <CardBody>
          <CardTitle>{title}</CardTitle>
          <p className="text-cream/70 mt-4 text-lg">
            Coming soon...
          </p>
        </CardBody>
      </Card>
    </div>
  );

  // Render placeholder views
  if (currentView === 'training') {
    return <PlaceholderView title="Log my training plan" />;
  }

  // Main hub view with two large buttons
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-cream mb-8 text-center">
        Training Hub
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {/* Coach Tools Button - For coaches and admins */}
        {(user?.user_type === 'coach' || user?.user_type === 'admin') ? (
          <button
            onClick={() => navigate('/coach-hub')}
            className="group relative bg-burgundy-dark border-2 border-cream/30 rounded-xl p-8 hover:border-cream/60 hover:shadow-glow transition-all duration-300"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-energy-gradient flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg
                  className="w-8 h-8 text-cream"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-cream text-center">
                Coach Tools
              </h2>
              <p className="text-cream/60 text-sm text-center">
                Manage teams, students, and training programmes
              </p>
            </div>
          </button>
        ) : (
          // For regular users, show a placeholder or different button
          <button
            onClick={() => alert('Coach tools are available for coaches only. Contact support to upgrade your account.')}
            className="group relative bg-burgundy-dark border-2 border-cream/30 rounded-xl p-8 hover:border-cream/60 hover:shadow-glow transition-all duration-300 opacity-75"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-energy-gradient flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg
                  className="w-8 h-8 text-cream"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-cream text-center">
                Coach Tools
              </h2>
              <p className="text-cream/60 text-sm text-center">
                Available for coach accounts
              </p>
            </div>
          </button>
        )}

        {/* Log Training Plan Button */}
        <button
          onClick={() => setCurrentView('training')}
          className="group relative bg-burgundy-dark border-2 border-cream/30 rounded-xl p-8 hover:border-cream/60 hover:shadow-glow transition-all duration-300"
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-energy-gradient flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg
                className="w-8 h-8 text-cream"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-cream text-center">
              Log my training plan
              <span className="block text-sm font-normal text-cream/50 mt-1">
                (Coming soon)
              </span>
            </h2>
            <p className="text-cream/60 text-sm text-center">
              Track your workouts and progress
            </p>
          </div>
        </button>
      </div>

      {/* Optional: Add a description below the buttons */}
      <div className="mt-12 text-center max-w-2xl mx-auto">
        <p className="text-cream/70 text-sm italic">
          Your comprehensive hub for training programmes and professional coaching support.
        </p>
      </div>
    </div>
  );
}
