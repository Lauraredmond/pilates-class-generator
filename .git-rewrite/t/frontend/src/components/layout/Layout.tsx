import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, BarChart3, User, Settings, ArrowLeft } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

// Custom logo icon component for Founder Story navigation
function LogoIcon({ size }: { size?: number }) {
  return (
    <img
      src="/assets/bassline-logo-transparent.png"
      alt="Founder Story"
      style={{ width: size || 18, height: size || 18 }}
      className="object-contain"
    />
  );
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  const navItems = [
    { path: '/', icon: Home, label: 'Home', shortLabel: 'Home' },
    { path: '/classes', icon: BookOpen, label: 'Training & Nutrition Hub', shortLabel: 'Hub' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics', shortLabel: 'Stats' },
    { path: '/profile', icon: User, label: 'Profile', shortLabel: 'Profile' },
    { path: '/settings', icon: Settings, label: 'Settings', shortLabel: 'Settings' },
    { path: '/founder-story', icon: LogoIcon, label: 'Founder Story', shortLabel: 'Story' },
  ];

  return (
    <div className="min-h-screen bg-premium-texture flex flex-col">
      {/* Header - Logo with Back Button (hidden on home page) */}
      {!isHomePage && (
        <header className="bg-burgundy-dark/80 backdrop-blur-sm border-b border-cream/20 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-center">
            <div className="group relative flex items-center gap-3">
              {/* Back Button - Always Visible */}
              <Link
                to="/"
                className="flex items-center gap-2 px-3 py-2 bg-burgundy/80 hover:bg-burgundy text-cream rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
                title="Back to Home"
              >
                <ArrowLeft size={20} />
                <span className="text-sm font-medium">Back</span>
              </Link>

              {/* Logo */}
              <Link to="/" className="cursor-pointer">
                <img
                  src="/assets/Logo4.jpg"
                  alt="Bassline Logo"
                  className="h-12 w-auto rounded-lg shadow-md transition-all duration-300 hover:scale-105 hover:brightness-110 hover:shadow-xl"
                  title="Back to Home"
                />
              </Link>

              {/* Logo credit - appears on hover of either back button or logo */}
              <span className="absolute left-1/2 -translate-x-1/2 -bottom-10 bg-charcoal/90 text-cream/70 text-[10px] px-3 py-1 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Logo by Cian Ryan, La Cathedral
              </span>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 pb-24">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-burgundy-dark/95 backdrop-blur-sm border-t border-cream/20 z-50">
        <div className="flex items-center justify-around py-1.5 px-1">
          {navItems.map(({ path, icon: Icon, shortLabel }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg min-w-0 ${
                  isActive ? 'text-cream' : 'text-cream/50'
                }`}
              >
                <Icon size={18} />
                <span className="text-[10px] leading-tight text-center">{shortLabel}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Desktop Bottom Navigation - Fixed */}
      <nav className="hidden md:block fixed bottom-0 left-0 right-0 bg-burgundy-dark/95 backdrop-blur-sm border-t border-cream/20 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-center gap-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  isActive
                    ? 'bg-burgundy text-cream shadow-md font-semibold'
                    : 'text-cream/70 hover:text-cream hover:bg-cream/10'
                }`}
              >
                <Icon size={18} />
                <span className="text-sm font-medium">{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
