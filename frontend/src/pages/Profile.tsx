import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardBody, CardTitle } from '../components/ui/Card';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface UserStats {
  total_classes: number;
  total_duration_minutes: number;
  total_movements: number;
  classes_this_week: number;
  classes_this_month: number;
  current_streak_days: number;
  favorite_movements: Array<{ id: string; name: string; difficulty_level: string }>;
  muscle_group_distribution: Record<string, number>;
  difficulty_distribution: Record<string, number>;
}

export function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/users/me/stats`);
        setStats(response.data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-cream">My Profile</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-burgundy-dark text-cream rounded hover:bg-burgundy transition-smooth"
        >
          Logout
        </button>
      </div>

      {/* User Info Card */}
      <Card className="mb-6">
        <CardBody>
          <CardTitle>Account Information</CardTitle>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-sm text-cream/60">Full Name</label>
              <p className="text-cream">{user.full_name || 'Not provided'}</p>
            </div>
            <div>
              <label className="text-sm text-cream/60">Email</label>
              <p className="text-cream">{user.email}</p>
            </div>
            <div>
              <label className="text-sm text-cream/60">Member Since</label>
              <p className="text-cream">{new Date(user.created_at).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="text-sm text-cream/60">Last Login</label>
              <p className="text-cream">
                {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Stats */}
      {loading ? (
        <Card>
          <CardBody>
            <p className="text-cream/70">Loading stats...</p>
          </CardBody>
        </Card>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Stats */}
          <Card>
            <CardBody>
              <CardTitle>Class Stats</CardTitle>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-cream/70">Total Classes</span>
                  <span className="text-cream font-semibold">{stats.total_classes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cream/70">Total Duration</span>
                  <span className="text-cream font-semibold">{stats.total_duration_minutes} min</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cream/70">Total Movements</span>
                  <span className="text-cream font-semibold">{stats.total_movements}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cream/70">This Week</span>
                  <span className="text-cream font-semibold">{stats.classes_this_week}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cream/70">This Month</span>
                  <span className="text-cream font-semibold">{stats.classes_this_month}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Favorite Movements */}
          <Card>
            <CardBody>
              <CardTitle>Favorite Movements</CardTitle>
              <div className="mt-4">
                {stats.favorite_movements.length > 0 ? (
                  <ul className="space-y-2">
                    {stats.favorite_movements.map((movement) => (
                      <li key={movement.id} className="text-cream flex justify-between">
                        <span>{movement.name}</span>
                        <span className="text-xs text-cream/60">{movement.difficulty_level}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-cream/70">No favorites yet</p>
                )}
              </div>
            </CardBody>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
