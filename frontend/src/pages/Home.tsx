import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Image */}
      <div className="relative w-full h-48 rounded-xl overflow-hidden mb-6 shadow-glow">
        <img
          src="/assets/hero-empowered-woman.jpg"
          alt="Empowered woman at the height of her fitness journey"
          className="w-full h-full object-cover transform hover:scale-105 transition-smooth"
        />
        <div className="absolute inset-0 bg-hero-gradient opacity-20"></div>
      </div>

      {/* Main Action Buttons */}
      <div className="space-y-3 mb-8">
        <Button className="w-full" size="lg" onClick={() => navigate('/class-builder')}>
          Build Class (Drag & Drop)
        </Button>

        <Button className="w-full" size="lg" onClick={() => navigate('/generate')}>
          Create New Class Plan
        </Button>

        <Button className="w-full" size="lg" onClick={() => navigate('/classes')}>
          View My Class Library
        </Button>

        <Button className="w-full" size="lg" variant="secondary" onClick={() => navigate('/analytics')}>
          Analytics & Progress
        </Button>
      </div>

      {/* Mission Statement */}
      <div className="mb-8">
        <p className="text-cream/90 text-center leading-relaxed italic text-lg tracking-wide">
          <span className="block mb-1 bg-gradient-to-r from-yellow-200 via-cream to-yellow-100 bg-clip-text text-transparent drop-shadow-sm">
            "Pilates Class Planner combines classical Pilates wisdom
          </span>
          <span className="block mb-1 text-cream/80">
            with AI-powered sequencing and research,
          </span>
          <span className="block bg-gradient-to-r from-yellow-200 via-cream to-yellow-100 bg-clip-text text-transparent drop-shadow-sm">
            helping you create safe, effective, and inspiring classes."
          </span>
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card-texture border border-cream/20 rounded-lg p-4 shadow-card">
          <p className="text-2xl mb-2">🎯</p>
          <p className="text-sm font-semibold text-primary mb-1">Smart Sequencing</p>
          <p className="text-xs text-primary/70">AI validates safety rules</p>
        </div>

        <div className="bg-card-texture border border-cream/20 rounded-lg p-4 shadow-card">
          <p className="text-2xl mb-2">🔬</p>
          <p className="text-sm font-semibold text-primary mb-1">Web Research</p>
          <p className="text-xs text-primary/70">Latest techniques & cues</p>
        </div>

        <div className="bg-card-texture border border-cream/20 rounded-lg p-4 shadow-card">
          <p className="text-2xl mb-2">🎵</p>
          <p className="text-sm font-semibold text-primary mb-1">Music Sync</p>
          <p className="text-xs text-primary/70">Match movement to rhythm</p>
        </div>

        <div className="bg-card-texture border border-cream/20 rounded-lg p-4 shadow-card">
          <p className="text-2xl mb-2">📊</p>
          <p className="text-sm font-semibold text-primary mb-1">Analytics</p>
          <p className="text-xs text-primary/70">Track your teaching</p>
        </div>
      </div>
    </div>
  );
}
