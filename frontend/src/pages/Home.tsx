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

      {/* Main Action Button */}
      <div className="mb-8">
        <Button className="w-full" size="lg" onClick={() => navigate('/class-builder')}>
          Build Class (Drag & Drop)
        </Button>
      </div>

      {/* Mission Statement */}
      <div className="mb-8">
        <p className="text-cream/90 text-center leading-relaxed italic text-base tracking-wide">
          <span className="block mb-2 bg-gradient-to-r from-yellow-200 via-cream to-yellow-100 bg-clip-text text-transparent drop-shadow-sm">
            "Bassline helps you progress quickly between instructor-led sessions,
          </span>
          <span className="block mb-2 text-cream/80">
            accelerating your competence in Pilates technique and principles.
          </span>
          <span className="block bg-gradient-to-r from-yellow-200 via-cream to-yellow-100 bg-clip-text text-transparent drop-shadow-sm">
            Data from your previous sessions is leveraged to build a varied programme which is tailored for you."
          </span>
        </p>
      </div>

    </div>
  );
}
