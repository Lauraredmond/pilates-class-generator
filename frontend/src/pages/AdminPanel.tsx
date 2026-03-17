import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  user_type: string;
  created_at: string;
  last_login: string;
}

interface ExerciseStats {
  sport: string;
  count: number;
}

export function AdminPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'users' | 'exercises' | 'stats'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [exerciseStats, setExerciseStats] = useState<ExerciseStats[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCoaches: 0,
    totalPractitioners: 0,
    totalExercises: 0,
    totalClasses: 0,
  });

  // Redirect if not admin
  if (!user || user.user_type !== 'admin') {
    navigate('/');
    return null;
  }

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'exercises') {
      fetchExerciseStats();
    } else if (activeTab === 'stats') {
      fetchDashboardStats();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchExerciseStats = async () => {
    try {
      setLoading(true);
      // TODO: Create admin API endpoints for exercise stats
      // For now, using empty array until backend endpoint is created
      // const response = await axios.get(`${API_BASE_URL}/api/admin/exercise-stats`);
      // setExerciseStats(response.data);
      setExerciseStats([]);
    } catch (error) {
      console.error('Error fetching exercise stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      // TODO: Create admin API endpoints for dashboard stats
      // For now, using default values until backend endpoint is created
      // const response = await axios.get(`${API_BASE_URL}/api/admin/stats`);
      // setStats(response.data);
      setStats({
        totalUsers: 0,
        totalCoaches: 0,
        totalPractitioners: 0,
        totalExercises: 0,
        totalClasses: 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserType = async (_userId: string, _newUserType: string) => {
    try {
      // TODO: Create admin API endpoint for updating user type
      // const response = await axios.put(`${API_BASE_URL}/api/admin/users/${userId}`, {
      //   user_type: newUserType
      // });

      // Refresh users list
      fetchUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user type:', error);
    }
  };

  return (
    <div className="min-h-screen bg-burgundy">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-cream mb-2">Admin Panel</h1>
          <p className="text-cream/70">
            Manage users, exercises, and monitor platform statistics
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-cream rounded-lg shadow-xl">
          <div className="border-b border-burgundy/20">
            <div className="flex space-x-1 p-2">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'users'
                    ? 'bg-burgundy text-cream'
                    : 'text-burgundy hover:bg-burgundy/10'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab('exercises')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'exercises'
                    ? 'bg-burgundy text-cream'
                    : 'text-burgundy hover:bg-burgundy/10'
                }`}
              >
                Exercises
              </button>
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'stats'
                    ? 'bg-burgundy text-cream'
                    : 'text-burgundy hover:bg-burgundy/10'
                }`}
              >
                Statistics
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-8 text-charcoal/60">Loading...</div>
            ) : (
              <>
                {/* Users Tab */}
                {activeTab === 'users' && (
                  <div>
                    <h2 className="text-xl font-semibold text-burgundy mb-4">
                      User Management ({users.length} users)
                    </h2>
                    <div className="overflow-x-auto">
                      <table className="w-full bg-white rounded-lg overflow-hidden">
                        <thead className="bg-burgundy/10">
                          <tr>
                            <th className="px-4 py-2 text-left text-burgundy">Email</th>
                            <th className="px-4 py-2 text-left text-burgundy">Name</th>
                            <th className="px-4 py-2 text-left text-burgundy">Type</th>
                            <th className="px-4 py-2 text-left text-burgundy">Joined</th>
                            <th className="px-4 py-2 text-left text-burgundy">Last Login</th>
                            <th className="px-4 py-2 text-left text-burgundy">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map(userProfile => (
                            <tr key={userProfile.id} className="border-b border-charcoal/10">
                              <td className="px-4 py-2 text-sm text-charcoal">{userProfile.email}</td>
                              <td className="px-4 py-2 text-sm text-charcoal">
                                {userProfile.full_name || '-'}
                              </td>
                              <td className="px-4 py-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  userProfile.user_type === 'admin'
                                    ? 'bg-red-100 text-red-700'
                                    : userProfile.user_type === 'coach'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {userProfile.user_type}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm text-charcoal">
                                {new Date(userProfile.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-2 text-sm text-charcoal">
                                {userProfile.last_login
                                  ? new Date(userProfile.last_login).toLocaleDateString()
                                  : 'Never'}
                              </td>
                              <td className="px-4 py-2">
                                <button
                                  onClick={() => setSelectedUser(userProfile)}
                                  className="text-burgundy hover:underline text-sm"
                                >
                                  Edit
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Exercises Tab */}
                {activeTab === 'exercises' && (
                  <div>
                    <h2 className="text-xl font-semibold text-burgundy mb-4">
                      Exercise Database
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {exerciseStats.map(stat => (
                        <div
                          key={stat.sport}
                          className="bg-white rounded-lg p-4 border border-charcoal/10"
                        >
                          <h3 className="text-lg font-semibold text-burgundy capitalize">
                            {stat.sport.toUpperCase()} Exercises
                          </h3>
                          <p className="text-2xl font-bold text-charcoal mt-2">
                            {stat.count}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/coach/sport/${stat.sport}`)}
                            className="mt-3 text-burgundy hover:text-burgundy/80"
                          >
                            View Exercises →
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Statistics Tab */}
                {activeTab === 'stats' && (
                  <div>
                    <h2 className="text-xl font-semibold text-burgundy mb-4">
                      Platform Statistics
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-white rounded-lg p-4 border border-charcoal/10">
                        <h3 className="text-sm text-charcoal/60">Total Users</h3>
                        <p className="text-3xl font-bold text-burgundy mt-2">
                          {stats.totalUsers}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-charcoal/10">
                        <h3 className="text-sm text-charcoal/60">Practitioners</h3>
                        <p className="text-3xl font-bold text-burgundy mt-2">
                          {stats.totalPractitioners}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-charcoal/10">
                        <h3 className="text-sm text-charcoal/60">Coaches</h3>
                        <p className="text-3xl font-bold text-burgundy mt-2">
                          {stats.totalCoaches}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-charcoal/10">
                        <h3 className="text-sm text-charcoal/60">Total Exercises</h3>
                        <p className="text-3xl font-bold text-burgundy mt-2">
                          {stats.totalExercises}
                        </p>
                      </div>
                      <div className="bg-white rounded-lg p-4 border border-charcoal/10">
                        <h3 className="text-sm text-charcoal/60">Classes Generated</h3>
                        <p className="text-3xl font-bold text-burgundy mt-2">
                          {stats.totalClasses}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Back Button */}
          <div className="p-6 pt-0 text-center">
            <Button
              variant="secondary"
              onClick={() => navigate('/')}
            >
              ← Back to Home
            </Button>
          </div>
        </div>
      </div>

      {/* Edit User Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-cream rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-burgundy mb-4">Edit User</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Email</label>
                <p className="text-charcoal/80">{selectedUser.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-1">Name</label>
                <p className="text-charcoal/80">{selectedUser.full_name || 'Not provided'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-charcoal mb-2">User Type</label>
                <select
                  value={selectedUser.user_type}
                  onChange={(e) => updateUserType(selectedUser.id, e.target.value)}
                  className="w-full px-3 py-2 border border-charcoal/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-burgundy"
                >
                  <option value="standard">Practitioner</option>
                  <option value="coach">Coach</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <Button
                variant="ghost"
                onClick={() => setSelectedUser(null)}
                className="text-charcoal"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => setSelectedUser(null)}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}