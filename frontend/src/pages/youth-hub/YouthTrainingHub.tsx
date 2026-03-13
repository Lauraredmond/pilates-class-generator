import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardTitle } from '../../components/ui/Card';
import { ArrowLeft, Users, Calendar, Activity, ClipboardList } from 'lucide-react';

// Role selection types
type HubRole = 'none' | 'parent' | 'coach' | 'both';
type ViewMode = 'selection' | 'parent' | 'coach';

export function YouthTrainingHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [hubRole, setHubRole] = useState<HubRole>('none');
  const [viewMode, setViewMode] = useState<ViewMode>('selection');

  // Check localStorage for saved role preference
  useEffect(() => {
    const savedRole = localStorage.getItem('youth_hub_role');
    if (savedRole && ['parent', 'coach', 'both'].includes(savedRole)) {
      setHubRole(savedRole as HubRole);
      // If user has a saved role, show appropriate view
      if (savedRole === 'parent') {
        setViewMode('parent');
      } else if (savedRole === 'coach' || savedRole === 'both') {
        setViewMode('coach');
      }
    }
  }, []);

  const handleRoleSelection = (role: HubRole) => {
    setHubRole(role);
    localStorage.setItem('youth_hub_role', role);

    if (role === 'parent') {
      navigate('/youth-hub/parent');
    } else if (role === 'coach') {
      navigate('/youth-hub/coach');
    } else if (role === 'both') {
      // Show option to choose which dashboard to view
      setViewMode('selection');
    }
  };

  const switchView = (view: ViewMode) => {
    setViewMode(view);
    if (view === 'parent') {
      navigate('/youth-hub/parent');
    } else if (view === 'coach') {
      navigate('/youth-hub/coach');
    }
  };

  // Role Selection View
  if (hubRole === 'none' || viewMode === 'selection') {
    return (
      <div className="min-h-screen bg-burgundy">
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Header with back button */}
          <button
            onClick={() => navigate('/coach-hub')}
            className="flex items-center gap-2 text-cream/70 hover:text-cream mb-6 transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Coach Hub</span>
          </button>

          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-cream mb-2">Youth Training Hub</h1>
            <p className="text-cream/70 max-w-2xl mx-auto">
              A multi-sport coaching diary and training visibility platform.
              Parents and coaches collaborate to track youth development across all sports.
            </p>
          </div>

          {/* Role Selection or Dashboard Switcher */}
          {hubRole === 'both' ? (
            // User has both roles - show dashboard switcher
            <div className="bg-cream rounded-lg shadow-xl p-6 mb-6">
              <h2 className="text-xl font-semibold text-burgundy mb-4 text-center">
                Select Your Dashboard
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => switchView('parent')}
                  className="bg-white rounded-lg shadow-card p-6 border-2 border-transparent hover:border-burgundy transition-all"
                >
                  <Users className="w-12 h-12 text-burgundy mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-burgundy mb-2">Parent Dashboard</h3>
                  <p className="text-sm text-charcoal/70">
                    Register children, share codes with coaches, log activities
                  </p>
                </button>

                <button
                  onClick={() => switchView('coach')}
                  className="bg-white rounded-lg shadow-card p-6 border-2 border-transparent hover:border-burgundy transition-all"
                >
                  <ClipboardList className="w-12 h-12 text-burgundy mx-auto mb-3" />
                  <h3 className="text-lg font-semibold text-burgundy mb-2">Coach Dashboard</h3>
                  <p className="text-sm text-charcoal/70">
                    Manage teams, log sessions, track player development
                  </p>
                </button>
              </div>
            </div>
          ) : (
            // Initial role selection
            <div className="bg-cream rounded-lg shadow-xl p-6">
              <h2 className="text-xl font-semibold text-burgundy mb-6 text-center">
                How will you use the Youth Training Hub?
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Parent Role Card */}
                <Card>
                  <CardBody>
                    <div className="text-center">
                      <Users className="w-16 h-16 text-burgundy mx-auto mb-4" />
                      <CardTitle className="mb-3">I'm a Parent</CardTitle>
                      <p className="text-sm text-charcoal/70 mb-4">
                        Register your children and track their training across all sports.
                        Share unique codes with coaches to give them access to log sessions.
                      </p>
                      <ul className="text-left text-sm text-charcoal/80 mb-4 space-y-1">
                        <li>• Register multiple children</li>
                        <li>• Log any sport or activity</li>
                        <li>• View comprehensive timeline</li>
                        <li>• Track progress across all sports</li>
                      </ul>
                      <Button
                        onClick={() => handleRoleSelection('parent')}
                        variant="primary"
                        className="w-full"
                      >
                        Continue as Parent
                      </Button>
                    </div>
                  </CardBody>
                </Card>

                {/* Coach Role Card */}
                <Card>
                  <CardBody>
                    <div className="text-center">
                      <ClipboardList className="w-16 h-16 text-burgundy mx-auto mb-4" />
                      <CardTitle className="mb-3">I'm a Coach</CardTitle>
                      <p className="text-sm text-charcoal/70 mb-4">
                        Create teams, link players using their codes, and log training sessions
                        with detailed drills for Rugby, Soccer, or GAA.
                      </p>
                      <ul className="text-left text-sm text-charcoal/80 mb-4 space-y-1">
                        <li>• Manage multiple teams</li>
                        <li>• Use drill templates</li>
                        <li>• Track attendance</li>
                        <li>• Monitor player development</li>
                      </ul>
                      <Button
                        onClick={() => handleRoleSelection('coach')}
                        variant="primary"
                        className="w-full"
                      >
                        Continue as Coach
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Both Roles Option */}
              <div className="border-t border-charcoal/20 pt-4">
                <button
                  onClick={() => handleRoleSelection('both')}
                  className="w-full p-4 bg-burgundy/5 rounded-lg hover:bg-burgundy/10 transition-colors"
                >
                  <div className="flex items-center justify-center gap-3">
                    <Activity className="w-5 h-5 text-burgundy" />
                    <span className="text-burgundy font-medium">
                      I'm both a Parent and a Coach
                    </span>
                  </div>
                  <p className="text-xs text-charcoal/60 mt-1">
                    You'll have access to both dashboards and can switch between them
                  </p>
                </button>
              </div>
            </div>
          )}

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            <div className="bg-cream/10 rounded-lg p-4 backdrop-blur-sm">
              <Calendar className="w-8 h-8 text-cream mb-2" />
              <h3 className="text-cream font-semibold mb-1">Weekly Timeline</h3>
              <p className="text-cream/70 text-sm">
                View all training in a unified calendar across every sport
              </p>
            </div>

            <div className="bg-cream/10 rounded-lg p-4 backdrop-blur-sm">
              <Activity className="w-8 h-8 text-cream mb-2" />
              <h3 className="text-cream font-semibold mb-1">Multi-Sport Support</h3>
              <p className="text-cream/70 text-sm">
                Track GAA, Rugby, Soccer, Swimming, Dance, and more
              </p>
            </div>

            <div className="bg-cream/10 rounded-lg p-4 backdrop-blur-sm">
              <Users className="w-8 h-8 text-cream mb-2" />
              <h3 className="text-cream font-semibold mb-1">Secure Collaboration</h3>
              <p className="text-cream/70 text-sm">
                6-character codes ensure only authorized coaches access youth data
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}