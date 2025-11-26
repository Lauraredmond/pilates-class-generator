import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Trash2, AlertTriangle, Edit2, Save, X, Key, CheckCircle, Bell, Shield, Settings as SettingsIcon, Music, FileDown, Info, Database, Download } from 'lucide-react';

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

  // Preferences state
  const [preferences, setPreferences] = useState({
    strictness_level: 'guided',
    default_class_duration: 60,
    enable_mcp_research: true,
    email_notifications: true,
    class_reminders: true,
    weekly_summary: false,
    analytics_enabled: true,
    data_sharing_enabled: false,
    music_preferences: {} as Record<string, any>
  });
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferencesError, setPreferencesError] = useState('');
  const [preferencesSuccess, setPreferencesSuccess] = useState('');

  // Compliance state
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [complianceError, setComplianceError] = useState('');
  const [complianceSuccess, setComplianceSuccess] = useState('');

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

  // Fetch preferences on component mount
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const response = await axios.get(`${API_BASE_URL}/api/auth/preferences`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setPreferences(response.data);
      } catch (error: any) {
        console.error('Failed to fetch preferences:', error);
        setPreferencesError('Failed to load preferences');
      } finally {
        setPreferencesLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  // Update a single preference
  const updatePreference = async (key: string, value: any) => {
    setPreferencesSaving(true);
    setPreferencesError('');
    setPreferencesSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      const updateData = { [key]: value };

      const response = await axios.put(
        `${API_BASE_URL}/api/auth/preferences`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      setPreferences(response.data);
      setPreferencesSuccess('Preference updated successfully');
      setTimeout(() => setPreferencesSuccess(''), 3000);
    } catch (error: any) {
      setPreferencesError(error.response?.data?.detail || 'Failed to update preference');
    } finally {
      setPreferencesSaving(false);
    }
  };

  // Compliance handlers
  const handleDownloadMyData = async () => {
    setComplianceLoading(true);
    setComplianceError('');
    setComplianceSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      // Request HTML format for beautiful, human-readable report
      const response = await axios.get(`${API_BASE_URL}/api/compliance/my-data?format=html`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Open the HTML report in a new tab
      const reportWindow = window.open('', '_blank');
      if (reportWindow) {
        reportWindow.document.write(response.data);
        reportWindow.document.close(); // Finish loading the document
      } else {
        // Fallback: If popup was blocked, download as HTML file
        const dataBlob = new Blob([response.data], { type: 'text/html' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bassline-my-data-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      setComplianceSuccess('Your data report has been opened in a new tab');
      setTimeout(() => setComplianceSuccess(''), 5000);
    } catch (error: any) {
      setComplianceError(error.response?.data?.detail || 'Failed to download data');
    } finally {
      setComplianceLoading(false);
    }
  };

  const handleViewROPAReport = async () => {
    setComplianceLoading(true);
    setComplianceError('');
    setComplianceSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      // Request HTML format for beautiful, human-readable report
      const response = await axios.get(`${API_BASE_URL}/api/compliance/ropa-report?format=html`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Open the HTML report in a new tab
      const reportWindow = window.open('', '_blank');
      if (reportWindow) {
        reportWindow.document.write(response.data);
        reportWindow.document.close(); // Finish loading the document
      } else {
        // Fallback: If popup was blocked, download as HTML file
        const dataBlob = new Blob([response.data], { type: 'text/html' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bassline-processing-activities-${new Date().toISOString().split('T')[0]}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      setComplianceSuccess('Processing activities report opened in new tab');
      setTimeout(() => setComplianceSuccess(''), 5000);
    } catch (error: any) {
      setComplianceError(error.response?.data?.detail || 'Failed to load ROPA report');
    } finally {
      setComplianceLoading(false);
    }
  };

  const handleViewAIDecisions = async () => {
    setComplianceLoading(true);
    setComplianceError('');

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/api/compliance/ai-decisions?limit=50`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Display AI decisions in a modal or new window
      const decisionsWindow = window.open('', '_blank');
      if (decisionsWindow) {
        decisionsWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>AI Decision Explanations</title>
            <style>
              body {
                font-family: system-ui, -apple-system, sans-serif;
                padding: 2rem;
                max-width: 1000px;
                margin: 0 auto;
                background: #1a1a1a;
                color: #f5f5f5;
              }
              h1 { color: #8b2635; }
              h2 { color: #a02d3e; margin-top: 2rem; }
              .decision { background: #2a2a2a; padding: 1.5rem; border-radius: 8px; margin: 1rem 0; }
              .stat { display: inline-block; margin: 0.5rem 1rem 0.5rem 0; }
              .confidence { color: #4ade80; }
              pre { background: #1a1a1a; padding: 1rem; overflow-x: auto; border-left: 3px solid #8b2635; font-size: 0.875rem; }
            </style>
          </head>
          <body>
            <h1>AI Decision Explanations</h1>
            <p><strong>Total Decisions:</strong> ${response.data.total_decisions}</p>

            <div class="decision">
              <h2>Statistics</h2>
              <div class="stat"><strong>Average Confidence:</strong> <span class="confidence">${(response.data.statistics?.average_confidence * 100).toFixed(1)}%</span></div>
              <div class="stat"><strong>User Overrides:</strong> ${response.data.statistics?.user_overrides || 0}</div>
              <div class="stat"><strong>Override Rate:</strong> ${response.data.statistics?.override_rate_percent || 0}%</div>
            </div>

            <h2>Recent Decisions</h2>
            ${response.data.total_decisions === 0 ? '<p><em>No AI decisions recorded yet. AI decisions will appear here after you generate classes or receive recommendations.</em></p>' :
              response.data.decisions.map((decision: any) => `
                <div class="decision">
                  <h3>${decision.agent_type.replace('_', ' ')} - ${new Date(decision.timestamp).toLocaleString()}</h3>
                  <p><strong>Model:</strong> ${decision.model_name}</p>
                  <p><strong>Confidence:</strong> <span class="confidence">${(decision.confidence_score * 100).toFixed(1)}%</span></p>
                  <p><strong>Reasoning:</strong> ${decision.reasoning || 'No reasoning provided'}</p>
                  ${decision.user_overridden ? '<p style="color: #fbbf24;"><strong>⚠️  You overrode this decision</strong></p>' : ''}
                </div>
              `).join('')
            }

            <div class="decision">
              <h2>EU AI Act Compliance</h2>
              <ul>
                <li><strong>Transparency:</strong> All AI decisions include reasoning</li>
                <li><strong>Explainability:</strong> You can see why the AI made each recommendation</li>
                <li><strong>Human Oversight:</strong> You can override any AI decision</li>
                <li><strong>Accuracy:</strong> Average confidence ${response.data.statistics?.average_confidence ? (response.data.statistics.average_confidence * 100).toFixed(1) : '0'}%</li>
              </ul>
            </div>
          </body>
          </html>
        `);
      }

      setComplianceSuccess('AI decisions opened in new window');
      setTimeout(() => setComplianceSuccess(''), 3000);
    } catch (error: any) {
      setComplianceError(error.response?.data?.detail || 'Failed to load AI decisions');
    } finally {
      setComplianceLoading(false);
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

      {/* Preferences Success/Error Messages */}
      {preferencesSuccess && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <p className="text-green-400">{preferencesSuccess}</p>
        </div>
      )}

      {preferencesError && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-sm text-red-700">{preferencesError}</p>
        </div>
      )}

      {/* Notification Preferences */}
      <div className="bg-charcoal rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-6 h-6 text-burgundy" />
          <h2 className="text-xl font-semibold text-cream">Notification Preferences</h2>
        </div>

        {preferencesLoading ? (
          <p className="text-cream/50">Loading preferences...</p>
        ) : (
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-burgundy/10 rounded cursor-pointer hover:bg-burgundy/20 transition-colors">
              <div>
                <div className="font-medium text-cream">Email Notifications</div>
                <div className="text-sm text-cream/60">Receive emails about account activity</div>
              </div>
              <input
                type="checkbox"
                checked={preferences.email_notifications}
                onChange={(e) => updatePreference('email_notifications', e.target.checked)}
                disabled={preferencesSaving}
                className="w-5 h-5 text-burgundy focus:ring-burgundy border-cream/30 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-burgundy/10 rounded cursor-pointer hover:bg-burgundy/20 transition-colors">
              <div>
                <div className="font-medium text-cream">Class Reminders</div>
                <div className="text-sm text-cream/60">Get notified before scheduled classes</div>
              </div>
              <input
                type="checkbox"
                checked={preferences.class_reminders}
                onChange={(e) => updatePreference('class_reminders', e.target.checked)}
                disabled={preferencesSaving}
                className="w-5 h-5 text-burgundy focus:ring-burgundy border-cream/30 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-burgundy/10 rounded cursor-pointer hover:bg-burgundy/20 transition-colors">
              <div>
                <div className="font-medium text-cream">Weekly Summary</div>
                <div className="text-sm text-cream/60">Receive a weekly summary of your progress</div>
              </div>
              <input
                type="checkbox"
                checked={preferences.weekly_summary}
                onChange={(e) => updatePreference('weekly_summary', e.target.checked)}
                disabled={preferencesSaving}
                className="w-5 h-5 text-burgundy focus:ring-burgundy border-cream/30 rounded"
              />
            </label>
          </div>
        )}
      </div>

      {/* Privacy Settings */}
      <div className="bg-charcoal rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-burgundy" />
          <h2 className="text-xl font-semibold text-cream">Privacy Settings</h2>
        </div>

        {preferencesLoading ? (
          <p className="text-cream/50">Loading preferences...</p>
        ) : (
          <div className="space-y-4">
            <label className="flex items-center justify-between p-4 bg-burgundy/10 rounded cursor-pointer hover:bg-burgundy/20 transition-colors">
              <div>
                <div className="font-medium text-cream">Analytics</div>
                <div className="text-sm text-cream/60">Help us improve by sharing anonymous usage data</div>
              </div>
              <input
                type="checkbox"
                checked={preferences.analytics_enabled}
                onChange={(e) => updatePreference('analytics_enabled', e.target.checked)}
                disabled={preferencesSaving}
                className="w-5 h-5 text-burgundy focus:ring-burgundy border-cream/30 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-burgundy/10 rounded cursor-pointer hover:bg-burgundy/20 transition-colors">
              <div>
                <div className="font-medium text-cream">Data Sharing</div>
                <div className="text-sm text-cream/60">Allow sharing data with third-party services</div>
              </div>
              <input
                type="checkbox"
                checked={preferences.data_sharing_enabled}
                onChange={(e) => updatePreference('data_sharing_enabled', e.target.checked)}
                disabled={preferencesSaving}
                className="w-5 h-5 text-burgundy focus:ring-burgundy border-cream/30 rounded"
              />
            </label>
          </div>
        )}
      </div>

      {/* AI Settings */}
      <div className="bg-charcoal rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <SettingsIcon className="w-6 h-6 text-burgundy" />
          <h2 className="text-xl font-semibold text-cream">AI Class Generation</h2>
        </div>

        {preferencesLoading ? (
          <p className="text-cream/50">Loading preferences...</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-cream mb-2">AI Strictness Level</label>
              <select
                value={preferences.strictness_level}
                onChange={(e) => updatePreference('strictness_level', e.target.value)}
                disabled={preferencesSaving}
                className="w-full px-4 py-2 bg-burgundy/20 border border-cream/20 rounded text-cream focus:outline-none focus:ring-2 focus:ring-burgundy"
              >
                <option value="guided">Guided - AI suggests with flexibility</option>
                <option value="strict">Strict - AI follows classical rules closely</option>
                <option value="autonomous">Autonomous - AI has full creative control</option>
              </select>
              <p className="text-xs text-cream/60 mt-1">
                {preferences.strictness_level === 'guided' && 'AI will suggest movements while allowing you to make changes'}
                {preferences.strictness_level === 'strict' && 'AI will strictly follow classical Pilates sequencing rules'}
                {preferences.strictness_level === 'autonomous' && 'AI will generate complete classes with full creative freedom'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-cream mb-2">Default Class Duration (minutes)</label>
              <input
                type="number"
                value={preferences.default_class_duration}
                onChange={(e) => {
                  // Update local state immediately for smooth typing
                  const value = e.target.value;
                  if (value === '') return; // Don't update if empty
                  const numValue = parseInt(value);
                  if (!isNaN(numValue) && numValue >= 10 && numValue <= 120) {
                    setPreferences({ ...preferences, default_class_duration: numValue });
                  }
                }}
                onBlur={(e) => {
                  // Only send to server when user finishes editing
                  const value = parseInt(e.target.value);
                  if (!isNaN(value) && value >= 10 && value <= 120) {
                    updatePreference('default_class_duration', value);
                  } else {
                    // Reset to previous valid value if invalid
                    setPreferences({ ...preferences, default_class_duration: preferences.default_class_duration });
                  }
                }}
                disabled={preferencesSaving}
                min={10}
                max={120}
                step={5}
                className="w-full px-4 py-2 bg-burgundy/20 border border-cream/20 rounded text-cream focus:outline-none focus:ring-2 focus:ring-burgundy"
              />
              <p className="text-xs text-cream/60 mt-1">Between 10 and 120 minutes (use up/down arrows or type directly)</p>
            </div>

            <label className="flex items-center justify-between p-4 bg-burgundy/10 rounded cursor-pointer hover:bg-burgundy/20 transition-colors">
              <div>
                <div className="font-medium text-cream">Enable Web Research</div>
                <div className="text-sm text-cream/60">Allow AI to research movement cues and modifications online</div>
              </div>
              <input
                type="checkbox"
                checked={preferences.enable_mcp_research}
                onChange={(e) => updatePreference('enable_mcp_research', e.target.checked)}
                disabled={preferencesSaving}
                className="w-5 h-5 text-burgundy focus:ring-burgundy border-cream/30 rounded"
              />
            </label>
          </div>
        )}
      </div>

      {/* Music Preferences */}
      <div className="bg-charcoal rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Music className="w-6 h-6 text-burgundy" />
          <h2 className="text-xl font-semibold text-cream">Music Preferences</h2>
        </div>

        {preferencesLoading ? (
          <p className="text-cream/50">Loading preferences...</p>
        ) : (
          <div className="space-y-4">
            <div className="bg-burgundy/10 rounded p-4">
              <p className="text-cream font-medium mb-2">Classical Music Styles</p>
              <p className="text-cream/60 text-sm mb-3">
                Music integration with Musopen and FreePD will be available in Session 10.
                Choose your preferred classical music periods for class accompaniment.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {['Baroque', 'Classical', 'Romantic', 'Impressionist', 'Modern', 'Contemporary', 'Celtic'].map((style) => (
                  <label key={style} className="flex items-center space-x-2 p-2 bg-burgundy/20 rounded cursor-pointer hover:bg-burgundy/30 transition-colors">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-burgundy focus:ring-burgundy border-cream/30 rounded"
                      disabled={true}
                    />
                    <span className="text-cream text-sm">{style}</span>
                  </label>
                ))}
              </div>
              <p className="text-cream/50 text-xs mt-3 italic">Music preferences will be functional in Session 10</p>
            </div>
          </div>
        )}
      </div>

      {/* Compliance & Privacy Dashboard */}
      <div className="bg-charcoal rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-burgundy" />
          <h2 className="text-xl font-semibold text-cream">Data & Privacy Rights</h2>
        </div>

        {/* Success/Error Messages */}
        {complianceSuccess && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <p className="text-green-400">{complianceSuccess}</p>
          </div>
        )}

        {complianceError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
            <p className="text-sm text-red-700">{complianceError}</p>
          </div>
        )}

        {/* Compliance Actions */}
        <div className="space-y-3 mb-4">
          <button
            onClick={handleDownloadMyData}
            disabled={complianceLoading}
            className="w-full flex items-center justify-between p-4 bg-burgundy/10 rounded hover:bg-burgundy/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <FileDown className="w-5 h-5 text-burgundy" />
              <div className="text-left">
                <div className="font-medium text-cream">Download My Data</div>
                <div className="text-sm text-cream/60">Export all your personal data (GDPR Article 15)</div>
              </div>
            </div>
            <Download className="w-5 h-5 text-cream/40" />
          </button>

          <button
            onClick={handleViewROPAReport}
            disabled={complianceLoading}
            className="w-full flex items-center justify-between p-4 bg-burgundy/10 rounded hover:bg-burgundy/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-burgundy" />
              <div className="text-left">
                <div className="font-medium text-cream">View Processing Activities</div>
                <div className="text-sm text-cream/60">See how your data has been processed (GDPR Article 30)</div>
              </div>
            </div>
            <Info className="w-5 h-5 text-cream/40" />
          </button>

          <button
            onClick={handleViewAIDecisions}
            disabled={complianceLoading}
            className="w-full flex items-center justify-between p-4 bg-burgundy/10 rounded hover:bg-burgundy/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-burgundy" />
              <div className="text-left">
                <div className="font-medium text-cream">View AI Decisions</div>
                <div className="text-sm text-cream/60">Understand AI recommendations (EU AI Act transparency)</div>
              </div>
            </div>
            <Shield className="w-5 h-5 text-cream/40" />
          </button>
        </div>

        {/* Compliance Status Badges */}
        <div className="bg-burgundy/10 rounded p-4">
          <p className="text-cream font-medium mb-3">Compliance Status</p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-green-900/30 px-3 py-2 rounded">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-medium">GDPR Compliant</span>
            </div>
            <div className="flex items-center gap-2 bg-green-900/30 px-3 py-2 rounded">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm font-medium">EU AI Act Compliant</span>
            </div>
          </div>
          <p className="text-cream/60 text-xs mt-3">
            Your data is protected and processed transparently in accordance with GDPR and EU AI Act regulations.
            You have the right to access, correct, delete, and export your data at any time.
          </p>
        </div>
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
