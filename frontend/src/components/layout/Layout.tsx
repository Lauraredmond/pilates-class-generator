import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Sparkles, BarChart3, User, Settings } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/classes', icon: BookOpen, label: 'Classes' },
    { path: '/generate', icon: Sparkles, label: 'Generate' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/profile', icon: User, label: 'Profile' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-premium-texture flex flex-col">
      {/* Header */}
      <header className="bg-burgundy-dark/80 backdrop-blur-sm border-b border-cream/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img src="/assets/Logo4.jpg" alt="Logo" className="h-12 w-auto rounded-lg shadow-md" />
            <span className="text-xl font-semibold text-cream hidden sm:block">Pilates Class Planner</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
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
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
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

      {/* Footer (desktop only) */}
      <footer className="hidden md:block py-4 text-center bg-burgundy-dark/50 border-t border-cream/10">
        <p className="text-cream/60 text-sm">
          v2.0 • Built with AI • GDPR Compliant
        </p>
      </footer>
    </div>
  );
}
