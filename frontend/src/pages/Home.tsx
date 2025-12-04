import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto">
      {/* Bassline Logo - Centered */}
      <div className="flex justify-center mb-8">
        <div className="group relative">
          <img
            src="/assets/Logo4.jpg"
            alt="Bassline Logo"
            className="h-24 w-auto rounded-lg shadow-glow"
            title="Logo by Cian Ryan, La Cathedral studios"
          />
          <span className="absolute left-1/2 -translate-x-1/2 -bottom-8 bg-burgundy-dark/95 text-cream text-xs px-3 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Logo by Cian Ryan, La Cathedral studios
          </span>
        </div>
      </div>

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
      <div className="space-y-4 mb-8">
        {/* New Primary Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={() => navigate('/classes')}
          variant="primary"
        >
          Create my baseline wellness routine
        </Button>

        {/* Existing Pilates Class Button */}
        <Button
          className="w-full"
          size="lg"
          onClick={() => navigate('/class-builder')}
          variant="secondary"
        >
          Generate my Pilates class
        </Button>
      </div>

      {/* Mission Statement */}
      <div className="mb-8">
        <p className="text-cream/90 text-center leading-relaxed italic text-[12px] tracking-wide">
          <span className="block mb-2 bg-gradient-to-r from-yellow-200 via-cream to-yellow-100 bg-clip-text text-transparent drop-shadow-sm">
            "Bassline helps you progress quickly between instructor-led sessions, accelerating your competence in Pilates technique and principles.
          </span>
          {/*<span className="block mb-2 text-cream/80">
            accelerating your competence in Pilates technique and principles.
          </span>*/}
          <span className="block bg-gradient-to-r from-yellow-200 via-cream to-yellow-100 bg-clip-text text-transparent drop-shadow-sm">
            Data from your previous sessions is leveraged to build a varied programme which is tailored for you."
          </span>
        </p>
      </div>

    </div>
  );
}
