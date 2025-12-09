import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Card, CardBody, CardTitle } from '../components/ui/Card';
import { Edit2, Save, X, CheckCircle } from 'lucide-react';

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

  // Profile editing state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState({
    fullName: user?.full_name || '',
    ageRange: user?.age_range || '',
    genderIdentity: user?.gender_identity || '',
    country: user?.country || '',
    pilatesExperience: user?.pilates_experience || '',
    goals: user?.goals || []
  });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

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

  const handleGoalToggle = (goal: string) => {
    setEditedProfile(prev => ({
      ...prev,
      goals: prev.goals.includes(goal)
        ? prev.goals.filter(g => g !== goal)
        : [...prev.goals, goal]
    }));
  };

  const handleSaveProfile = async () => {
    setProfileError('');
    setProfileSuccess('');
    setIsSavingProfile(true);

    try {
      const token = localStorage.getItem('access_token');
      await axios.put(`${API_BASE_URL}/api/auth/profile`, {
        full_name: editedProfile.fullName || null,
        age_range: editedProfile.ageRange || null,
        gender_identity: editedProfile.genderIdentity || null,
        country: editedProfile.country || null,
        pilates_experience: editedProfile.pilatesExperience || null,
        goals: editedProfile.goals.length > 0 ? editedProfile.goals : null
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setProfileSuccess('Profile updated successfully!');
      setIsEditingProfile(false);

      // Reload page to refresh user data from AuthContext
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error: any) {
      setProfileError(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedProfile({
      fullName: user?.full_name || '',
      ageRange: user?.age_range || '',
      genderIdentity: user?.gender_identity || '',
      country: user?.country || '',
      pilatesExperience: user?.pilates_experience || '',
      goals: user?.goals || []
    });
    setIsEditingProfile(false);
    setProfileError('');
  };

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

      {/* Success Message */}
      {profileSuccess && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <p className="text-green-400">{profileSuccess}</p>
        </div>
      )}

      {/* Profile Information Card */}
      <Card className="mb-6">
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <CardTitle>Personal Information</CardTitle>
            {!isEditingProfile && (
              <button
                onClick={() => setIsEditingProfile(true)}
                className="flex items-center gap-2 text-burgundy hover:text-burgundy/80 transition-smooth"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            )}
          </div>

          {profileError && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4">
              <p className="text-sm text-red-700">{profileError}</p>
            </div>
          )}

          {isEditingProfile ? (
            // Edit Mode
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cream mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editedProfile.fullName}
                    onChange={(e) => setEditedProfile({ ...editedProfile, fullName: e.target.value })}
                    className="w-full px-4 py-2 bg-burgundy/20 border border-cream/20 rounded text-cream focus:outline-none focus:ring-2 focus:ring-burgundy"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cream mb-1">Email (cannot be changed)</label>
                  <input
                    type="email"
                    value={user?.email}
                    disabled
                    className="w-full px-4 py-2 bg-charcoal/50 border border-cream/10 rounded text-cream/50 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cream mb-1">Age Range</label>
                  <select
                    value={editedProfile.ageRange}
                    onChange={(e) => setEditedProfile({ ...editedProfile, ageRange: e.target.value })}
                    className="w-full px-4 py-2 bg-burgundy/20 border border-cream/20 rounded text-cream focus:outline-none focus:ring-2 focus:ring-burgundy"
                  >
                    <option value="">Select age range</option>
                    <option value="18-24">18-24</option>
                    <option value="25-34">25-34</option>
                    <option value="35-44">35-44</option>
                    <option value="45-54">45-54</option>
                    <option value="55-64">55-64</option>
                    <option value="65+">65+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-cream mb-1">Gender Identity</label>
                  <select
                    value={editedProfile.genderIdentity}
                    onChange={(e) => setEditedProfile({ ...editedProfile, genderIdentity: e.target.value })}
                    className="w-full px-4 py-2 bg-burgundy/20 border border-cream/20 rounded text-cream focus:outline-none focus:ring-2 focus:ring-burgundy"
                  >
                    <option value="">Select gender identity</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Non-binary">Non-binary</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-cream mb-1">Country</label>
                  <input
                    type="text"
                    value={editedProfile.country}
                    onChange={(e) => setEditedProfile({ ...editedProfile, country: e.target.value })}
                    className="w-full px-4 py-2 bg-burgundy/20 border border-cream/20 rounded text-cream focus:outline-none focus:ring-2 focus:ring-burgundy"
                    placeholder="United States"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cream mb-1">Pilates Experience</label>
                  <select
                    value={editedProfile.pilatesExperience}
                    onChange={(e) => setEditedProfile({ ...editedProfile, pilatesExperience: e.target.value })}
                    className="w-full px-4 py-2 bg-burgundy/20 border border-cream/20 rounded text-cream focus:outline-none focus:ring-2 focus:ring-burgundy"
                  >
                    <option value="">Select experience level</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Instructor">Instructor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-cream mb-2">Your Goals</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {['stress_relief', 'tone_strength', 'performance', 'habit_building'].map((goal) => (
                    <label key={goal} className="flex items-center space-x-3 p-3 bg-burgundy/10 border border-cream/20 rounded cursor-pointer hover:bg-burgundy/20 transition-colors">
                      <input
                        type="checkbox"
                        checked={editedProfile.goals.includes(goal)}
                        onChange={() => handleGoalToggle(goal)}
                        className="w-5 h-5 text-burgundy focus:ring-burgundy border-cream/30 rounded"
                      />
                      <span className="text-cream">{goal.replace('_', ' ')}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="flex items-center gap-2 bg-burgundy hover:bg-burgundy/90 text-cream px-6 py-2 rounded font-semibold transition-smooth disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {isSavingProfile ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isSavingProfile}
                  className="flex items-center gap-2 bg-cream/10 hover:bg-cream/20 text-cream px-6 py-2 rounded font-semibold transition-smooth disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // View Mode
            <div className="space-y-3">
              <div>
                <label className="text-sm text-cream/60">Email</label>
                <p className="text-cream">{user?.email}</p>
              </div>
              {user?.full_name && (
                <div>
                  <label className="text-sm text-cream/60">Full Name</label>
                  <p className="text-cream">{user.full_name}</p>
                </div>
              )}
              {user?.pilates_experience && (
                <div>
                  <label className="text-sm text-cream/60">Pilates Experience</label>
                  <p className="text-cream">{user.pilates_experience}</p>
                </div>
              )}
              {user?.age_range && (
                <div>
                  <label className="text-sm text-cream/60">Age Range</label>
                  <p className="text-cream">{user.age_range}</p>
                </div>
              )}
              {user?.gender_identity && (
                <div>
                  <label className="text-sm text-cream/60">Gender Identity</label>
                  <p className="text-cream">{user.gender_identity}</p>
                </div>
              )}
              {user?.country && (
                <div>
                  <label className="text-sm text-cream/60">Country</label>
                  <p className="text-cream">{user.country}</p>
                </div>
              )}
              {user?.goals && user.goals.length > 0 && (
                <div>
                  <label className="text-sm text-cream/60">Goals</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {user.goals.map((goal) => (
                      <span
                        key={goal}
                        className="px-3 py-1 bg-burgundy/20 text-cream text-sm rounded-full"
                      >
                        {goal.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="pt-3 border-t border-cream/10 mt-4">
                <div className="grid grid-cols-2 gap-4">
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
              </div>
            </div>
          )}
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
