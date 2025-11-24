import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Trash2, AlertTriangle, Edit2, Save, X, Key, CheckCircle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  // Password change state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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

      // Update AuthContext with new user data
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

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters');
      return;
    }

    setIsChangingPassword(true);

    try {
      const token = localStorage.getItem('access_token');
      await axios.post(`${API_BASE_URL}/api/auth/change-password`, {
        current_password: currentPassword,
        new_password: newPassword
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setPasswordSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (error: any) {
      setPasswordError(error.response?.data?.detail || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('Please enter your password to confirm');
      return;
    }

    setIsDeleting(true);
    setDeleteError('');

    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${API_BASE_URL}/api/auth/account`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        data: {
          password: deletePassword
        }
      });

      logout();
      navigate('/login', {
        state: {
          message: 'Your account has been permanently deleted. Thank you for using Bassline.'
        }
      });
    } catch (error: any) {
      setDeleteError(error.response?.data?.detail || 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-cream mb-6">Settings</h1>

      {/* Success/Error Messages */}
      {profileSuccess && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <p className="text-green-400">{profileSuccess}</p>
        </div>
      )}

      {/* Account Information */}
      <div className="bg-charcoal rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-cream">Account Information</h2>
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
          </div>
        )}
      </div>

      {/* Password Change */}
      <div className="bg-charcoal rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-cream mb-4">Security</h2>
        <button
          onClick={() => setShowPasswordModal(true)}
          className="flex items-center gap-2 bg-burgundy hover:bg-burgundy/90 text-cream px-4 py-2 rounded font-semibold transition-smooth"
        >
          <Key className="w-4 h-4" />
          Change Password
        </button>
      </div>

      {/* Preferences (Coming Soon) */}
      <div className="bg-charcoal rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-cream mb-4">Preferences</h2>
        <p className="text-cream/70">
          Configure AI strictness, music preferences, research sources, and more.
        </p>
        <p className="text-cream/50 text-sm mt-2">Coming soon!</p>
      </div>

      {/* Danger Zone - Delete Account */}
      <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-red-400 mb-2 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Danger Zone
        </h2>
        <p className="text-cream/70 mb-4">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold transition-smooth"
        >
          <Trash2 className="w-4 h-4" />
          Delete Account
        </button>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-charcoal rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <Key className="w-8 h-8 text-burgundy" />
              <h2 className="text-2xl font-bold text-cream">Change Password</h2>
            </div>

            {passwordSuccess && (
              <div className="bg-green-900/20 border border-green-500/30 rounded p-3 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-green-400">{passwordSuccess}</p>
              </div>
            )}

            {passwordError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4">
                <p className="text-sm text-red-700">{passwordError}</p>
              </div>
            )}

            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-cream mb-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-burgundy/20 border border-cream/20 rounded text-cream placeholder-cream/40 focus:outline-none focus:ring-2 focus:ring-burgundy"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-cream mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-burgundy/20 border border-cream/20 rounded text-cream placeholder-cream/40 focus:outline-none focus:ring-2 focus:ring-burgundy"
                  placeholder="••••••••"
                  minLength={8}
                />
                <p className="text-xs text-cream/60 mt-1">At least 8 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-cream mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-burgundy/20 border border-cream/20 rounded text-cream placeholder-cream/40 focus:outline-none focus:ring-2 focus:ring-burgundy"
                  placeholder="••••••••"
                  minLength={8}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmNewPassword('');
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
                disabled={isChangingPassword}
                className="flex-1 bg-cream/10 hover:bg-cream/20 text-cream px-4 py-2 rounded font-semibold transition-smooth disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={isChangingPassword || !currentPassword || !newPassword || !confirmNewPassword}
                className="flex-1 bg-burgundy hover:bg-burgundy/90 text-cream px-4 py-2 rounded font-semibold transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isChangingPassword ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-charcoal rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <h2 className="text-2xl font-bold text-cream">Delete Account?</h2>
            </div>

            <div className="bg-red-900/20 border border-red-500/30 rounded p-4 mb-4">
              <p className="text-red-400 font-semibold mb-2">Warning: This is permanent!</p>
              <ul className="text-cream/70 text-sm space-y-1 list-disc list-inside">
                <li>Your account will be permanently deleted</li>
                <li>All your saved classes will be removed</li>
                <li>Your preferences and settings will be erased</li>
                <li>This action cannot be undone</li>
              </ul>
            </div>

            <div className="mb-4">
              <label htmlFor="delete-password" className="block text-sm font-medium text-cream mb-2">
                Enter your password to confirm
              </label>
              <input
                id="delete-password"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Your password"
                className="w-full px-4 py-2 bg-burgundy/20 border border-cream/20 rounded text-cream placeholder-cream/40 focus:outline-none focus:ring-2 focus:ring-red-500"
                autoFocus
              />
            </div>

            {deleteError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4">
                <p className="text-sm text-red-700">{deleteError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletePassword('');
                  setDeleteError('');
                }}
                disabled={isDeleting}
                className="flex-1 bg-cream/10 hover:bg-cream/20 text-cream px-4 py-2 rounded font-semibold transition-smooth disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || !deletePassword}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete My Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
