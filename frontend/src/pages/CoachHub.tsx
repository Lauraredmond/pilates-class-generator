import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';

export function CoachHub() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if not a coach or admin
  if (!user || (user.user_type !== 'coach' && user.user_type !== 'admin')) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-burgundy">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cream mb-2">Coach Hub</h1>
          <p className="text-cream/70">
            Integrate Pilates training into your sports programmes
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-cream rounded-lg shadow-xl p-6">
          {/* Tool Buttons Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Manage Students Button */}
            <div className="bg-white rounded-lg shadow-card p-6 border border-charcoal/10">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-burgundy">
                  Manage my Pilates students
                </h3>
                <p className="text-sm text-charcoal/60 mt-2">
                  Track student progress and assign personalised programmes
                </p>
              </div>
              <Button
                className="w-full"
                variant="primary"
                onClick={() => navigate('/coach/students')}
              >
                Coming Soon
              </Button>
            </div>

            {/* GAA Team Button */}
            <div className="bg-white rounded-lg shadow-card p-6 border border-charcoal/10">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-burgundy">
                  Manage my GAA team
                </h3>
                <p className="text-sm text-charcoal/60 mt-2">
                  Pilates exercises designed for hurling and Gaelic football
                </p>
              </div>
              <Button
                className="w-full"
                variant="primary"
                onClick={() => navigate('/coach/sport/gaa')}
              >
                Open GAA Programme
              </Button>
            </div>

            {/* Soccer Team Button */}
            <div className="bg-white rounded-lg shadow-card p-6 border border-charcoal/10">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-burgundy">
                  Manage my Soccer team
                </h3>
                <p className="text-sm text-charcoal/60 mt-2">
                  Pilates exercises mapped to soccer performance needs
                </p>
              </div>
              <Button
                className="w-full"
                variant="primary"
                onClick={() => navigate('/coach/sport/soccer')}
              >
                Open Soccer Programme
              </Button>
            </div>

            {/* Rugby Team Button */}
            <div className="bg-white rounded-lg shadow-card p-6 border border-charcoal/10">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-burgundy">
                  Manage my Rugby team
                </h3>
                <p className="text-sm text-charcoal/60 mt-2">
                  Pilates exercises for rugby-specific strength and flexibility
                </p>
              </div>
              <Button
                className="w-full"
                variant="primary"
                onClick={() => navigate('/coach/sport/rugby')}
              >
                Open Rugby Programme
              </Button>
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-8 p-4 bg-burgundy/5 rounded-lg border border-burgundy/20">
            <h4 className="text-sm font-semibold text-burgundy mb-2">
              About Coach Tools
            </h4>
            <p className="text-xs text-charcoal/70 leading-relaxed">
              Each sport programme contains the complete classical Pilates repertoire with sport-specific
              annotations explaining relevance, injury prevention benefits, and position-specific applications.
              Build custom sessions for your teams and track their progress over time.
            </p>
          </div>

          {/* Back Button */}
          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-burgundy hover:text-burgundy/80"
            >
              ← Back to Home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}