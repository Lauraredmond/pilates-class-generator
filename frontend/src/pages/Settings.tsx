import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Trash2, AlertTriangle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

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

      // Account deleted successfully - logout and redirect
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

      {/* Account Information */}
      <div className="bg-charcoal rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-cream mb-4">Account Information</h2>
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
      </div>

      {/* Preferences (Coming Soon) */}
      <div className="bg-charcoal rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold text-cream mb-4">Preferences</h2>
        <p className="text-cream/70">
          Configure AI strictness, music preferences, research sources, and more.
        </p>
        <p className="text-cream/50 text-sm mt-2">Coming in Session 8!</p>
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
