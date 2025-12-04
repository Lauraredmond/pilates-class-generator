import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, BarChart3, User, Settings } from 'lucide-react';

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
    { path: '/', icon: Home, label: 'Home' },
    { path: '/classes', icon: BookOpen, label: 'Classes' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/profile', icon: User, label: 'Profile' },
    { path: '/settings', icon: Settings, label: 'Settings' },
    { path: '/generate', icon: LogoIcon, label: 'Founder Story' }, // Moved to rightmost, renamed, custom logo icon
  ];

  return (
    <div className="min-h-screen bg-premium-texture flex flex-col">
      {/* Header - Logo only (hidden on home page) */}
      {!isHomePage && (
        <header className="bg-burgundy-dark/80 backdrop-blur-sm border-b border-cream/20 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-center">
            <Link to="/" className="group relative">
              <img
                src="/assets/Logo4.jpg"
                alt="Bassline Logo"
                className="h-12 w-auto rounded-lg shadow-md"
                title="Logo by Cian Ryan, La Cathedral studios"
              />
              <span className="absolute left-1/2 -translate-x-1/2 -bottom-8 bg-burgundy-dark/95 text-cream text-xs px-3 py-1 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Logo by Cian Ryan, La Cathedral studios
              </span>
            </Link>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6 pb-24">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-burgundy-dark/95 backdrop-blur-sm border-t border-cream/20 z-50">
        <div className="flex items-center justify-around py-2">
          {navItems.slice(0, 5).map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg ${
                  isActive ? 'text-cream' : 'text-cream/50'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs">{label}</span>
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
                    ? 'bg-energy-gradient text-cream shadow-md'
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
