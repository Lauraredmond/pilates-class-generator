import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardBody, CardTitle } from '../components/ui/Card';

type ViewType = 'main' | 'trainer' | 'training' | 'nutrition';

export function Classes() {
  const [currentView, setCurrentView] = useState<ViewType>('main');

  // Placeholder view component
  const PlaceholderView = ({ title }: { title: string }) => (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => setCurrentView('main')}
        className="flex items-center gap-2 text-cream/70 hover:text-cream mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span>Back to Training & Nutrition Hub</span>
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
  if (currentView === 'trainer') {
    return <PlaceholderView title="Connect with a trainer" />;
  }

  if (currentView === 'training') {
    return <PlaceholderView title="Log my training plan" />;
  }

  if (currentView === 'nutrition') {
    return <PlaceholderView title="Log my nutrition plan" />;
  }

  // Main hub view with three large buttons
  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-cream mb-8 text-center">
        Training & Nutrition Hub
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {/* Connect with a Trainer Button */}
        <button
          onClick={() => setCurrentView('trainer')}
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-cream text-center">
              Connect with a trainer
            </h2>
            <p className="text-cream/60 text-sm text-center">
              Find and connect with certified trainers
            </p>
          </div>
        </button>

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
            </h2>
            <p className="text-cream/60 text-sm text-center">
              Track your workouts and progress
            </p>
          </div>
        </button>

        {/* Log Nutrition Plan Button */}
        <button
          onClick={() => setCurrentView('nutrition')}
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
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-cream text-center">
              Log my nutrition plan
            </h2>
            <p className="text-cream/60 text-sm text-center">
              Monitor your meals and nutrition goals
            </p>
          </div>
        </button>
      </div>

      {/* Optional: Add a description below the buttons */}
      <div className="mt-12 text-center max-w-2xl mx-auto">
        <p className="text-cream/70 text-sm italic">
          Your comprehensive wellness hub for training, nutrition, and professional guidance.
        </p>
      </div>
    </div>
  );
}
