import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Trash2, AlertTriangle, Key, CheckCircle, Bell, Shield, Settings as SettingsIcon, FileDown, Info, Database, Download, ChevronDown, ChevronUp, X, MessageSquare, FileText, Wrench } from 'lucide-react';
import { logger } from '../utils/logger';
import { RecordingModeManager } from '../components/recording-mode/RecordingModeManager';
import { DebugPanel } from '../components/DebugPanel';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Collapsible sections state
  const [expandedSections, setExpandedSections] = useState({
    security: true,
    notifications: false,
    ai: false,
    compliance: false,
    developer: false,
    danger: false
  });

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
    use_ai_agent: false,  // Session 10: Jentic Integration toggle
    email_notifications: true,
    class_reminders: true,
    weekly_summary: false,
    analytics_enabled: true,
    data_sharing_enabled: false
  });
  const [preferencesLoading, setPreferencesLoading] = useState(true);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferencesError, setPreferencesError] = useState('');
  const [preferencesSuccess, setPreferencesSuccess] = useState('');

  // Compliance state
  const [complianceLoading, setComplianceLoading] = useState(false);
  const [complianceError, setComplianceError] = useState('');
  const [complianceSuccess, setComplianceSuccess] = useState('');

  // Report modal state (for mobile-friendly viewing)
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [reportType, setReportType] = useState<'dpia' | 'ropa' | 'ai'>('dpia');

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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
        logger.error('Failed to fetch preferences:', error);
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

      // Show report in modal (mobile-friendly)
      setReportContent(response.data);
      setReportType('dpia');
      setShowReportModal(true);

      setComplianceSuccess('Your data report is ready to view');
      setTimeout(() => setComplianceSuccess(''), 5000);
    } catch (error: any) {
      setComplianceError(error.response?.data?.detail || 'Failed to download data');
    } finally {
      setComplianceLoading(false);
    }
  };

  const handleDownloadMyDataJSON = async () => {
    setComplianceLoading(true);
    setComplianceError('');
    setComplianceSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      // Request JSON format for machine-readable data
      const response = await axios.get(`${API_BASE_URL}/api/compliance/my-data?format=json`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Download JSON file
      const dataBlob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bassline-my-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setComplianceSuccess('Your data has been downloaded as JSON');
      setTimeout(() => setComplianceSuccess(''), 5000);
    } catch (error: any) {
      setComplianceError(error.response?.data?.detail || 'Failed to download JSON data');
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

      // Show report in modal (mobile-friendly)
      setReportContent(response.data);
      setReportType('ropa');
      setShowReportModal(true);

      setComplianceSuccess('Processing activities report is ready to view');
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
    setComplianceSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      // Request HTML format for beautiful, human-readable report
      const response = await axios.get(`${API_BASE_URL}/api/compliance/ai-decisions?format=html&limit=50`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Show report in modal (mobile-friendly)
      setReportContent(response.data);
      setReportType('ai');
      setShowReportModal(true);

      setComplianceSuccess('AI decisions report is ready to view');
      setTimeout(() => setComplianceSuccess(''), 5000);
    } catch (error: any) {
      setComplianceError(error.response?.data?.detail || 'Failed to load AI decisions');
    } finally {
      setComplianceLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-cream mb-6">Settings</h1>

      <p className="text-cream/70 mb-6">
        Configure how the app behaves. To view or edit your personal information, visit your{' '}
        <button
          onClick={() => navigate('/profile')}
          className="text-burgundy hover:text-burgundy/80 font-semibold underline"
        >
          Profile page
        </button>.
      </p>

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

      {/* Security */}
      <div className="bg-charcoal rounded-lg mb-4 border-2 border-cream/10">
        <button
          onClick={() => toggleSection('security')}
          className="w-full flex items-center justify-between p-6 hover:bg-cream/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Key className="w-6 h-6 text-burgundy" />
            <h2 className="text-xl font-semibold text-cream">Security</h2>
          </div>
          {expandedSections.security ? (
            <ChevronUp className="w-5 h-5 text-cream/60" />
          ) : (
            <ChevronDown className="w-5 h-5 text-cream/60" />
          )}
        </button>

        {expandedSections.security && (
          <div className="px-6 pb-6">
            <p className="text-cream/60 text-sm mb-4">
              Manage your account security settings
            </p>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="flex items-center gap-2 bg-burgundy hover:bg-burgundy/90 text-cream px-4 py-2 rounded font-semibold transition-smooth"
            >
              <Key className="w-4 h-4" />
              Change Password
            </button>
          </div>
        )}
      </div>

      {/* Notification Preferences */}
      <div className="bg-charcoal rounded-lg mb-4 border-2 border-cream/10">
        <button
          onClick={() => toggleSection('notifications')}
          className="w-full flex items-center justify-between p-6 hover:bg-cream/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-burgundy" />
            <h2 className="text-xl font-semibold text-cream">Notification Preferences</h2>
          </div>
          {expandedSections.notifications ? (
            <ChevronUp className="w-5 h-5 text-cream/60" />
          ) : (
            <ChevronDown className="w-5 h-5 text-cream/60" />
          )}
        </button>

        {expandedSections.notifications && (
          <div className="px-6 pb-6">
            <p className="text-cream/60 text-sm mb-4">
              Control how we communicate with you
            </p>
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
        )}
      </div>

      {/* AI Settings */}
      <div className="bg-charcoal rounded-lg mb-4 border-2 border-cream/10">
        <button
          onClick={() => toggleSection('ai')}
          className="w-full flex items-center justify-between p-6 hover:bg-cream/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <SettingsIcon className="w-6 h-6 text-burgundy" />
            <h2 className="text-xl font-semibold text-cream">AI Class Generation</h2>
          </div>
          {expandedSections.ai ? (
            <ChevronUp className="w-5 h-5 text-cream/60" />
          ) : (
            <ChevronDown className="w-5 h-5 text-cream/60" />
          )}
        </button>

        {expandedSections.ai && (
          <div className="px-6 pb-6">
            <p className="text-cream/60 text-sm mb-4">
              Configure AI behavior for class planning
            </p>
            {preferencesLoading ? (
              <p className="text-cream/50">Loading preferences...</p>
            ) : (
              <div className="space-y-4">
                {/* AI Agent Toggle - Admin Only (Cost Control) */}
                {user?.is_admin ? (
                  <>
                    <label className="flex items-center justify-between p-4 bg-burgundy/10 rounded cursor-pointer hover:bg-burgundy/20 transition-colors border-2 border-burgundy/30">
                      <div>
                        <div className="font-medium text-cream flex items-center gap-2">
                          Use AI Agent for Class Generation
                          <span className="text-xs bg-burgundy px-2 py-0.5 rounded text-cream/90">Admin Only</span>
                          <span className="text-xs bg-green-900/50 px-2 py-0.5 rounded text-green-400">Jentic StandardAgent</span>
                        </div>
                        <div className="text-sm text-cream/60 mt-1">
                          Enable intelligent AI reasoning for class creation with GPT-4.
                        </div>
                        <div className="text-xs text-cream/50 mt-2 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Enabled:</span>
                            <span>LLM-powered planning, ~60-70s first request (cache miss), {'<'}5s cached, costs $0.25-0.30 per class</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">Disabled:</span>
                            <span>Database selection, {'<'}1s, free</span>
                          </div>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={preferences.use_ai_agent || false}
                        onChange={(e) => updatePreference('use_ai_agent', e.target.checked)}
                        disabled={preferencesSaving}
                        className="w-5 h-5 text-burgundy focus:ring-burgundy border-cream/30 rounded"
                      />
                    </label>

                    {preferences.use_ai_agent && (
                      <div className="bg-blue-900/20 border border-blue-500/30 rounded p-4">
                        <p className="text-blue-400 font-semibold mb-2">AI Agent Enabled</p>
                        <p className="text-cream/70 text-sm mb-2">
                          Your classes will be generated using advanced AI reasoning with GPT-4 via Jentic's StandardAgent framework.
                          This provides more intelligent and adaptive class planning, but incurs OpenAI API costs.
                        </p>
                        <p className="text-cream/50 text-xs">
                          Estimated cost: $0.25-0.30 per class (first request), $0.05-0.10 (cached requests) | Phase 1 optimization with Redis caching + GPT-3.5-turbo
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-cream/10 border border-cream/20 rounded p-4">
                    <p className="text-cream font-medium mb-2">AI Class Generation (Admin Only)</p>
                    <p className="text-cream/60 text-sm">
                      AI-powered class generation with GPT-4 is restricted to administrators to control OpenAI API costs.
                      Standard class generation is available to all users and uses pre-validated database content.
                    </p>
                  </div>
                )}

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
        )}
      </div>

      {/* Data, Privacy & General Compliance */}
      <div className="bg-charcoal rounded-lg mb-4 border-2 border-cream/10">
        <button
          onClick={() => toggleSection('compliance')}
          className="w-full flex items-center justify-between p-6 hover:bg-cream/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-burgundy" />
            <h2 className="text-xl font-semibold text-cream">Data, Privacy & General Compliance</h2>
          </div>
          {expandedSections.compliance ? (
            <ChevronUp className="w-5 h-5 text-cream/60" />
          ) : (
            <ChevronDown className="w-5 h-5 text-cream/60" />
          )}
        </button>

        {expandedSections.compliance && (
          <div className="px-6 pb-6">
            <p className="text-cream/60 text-sm mb-6">
              Manage your privacy settings, access your data, and review compliance information
            </p>

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

            {/* Privacy Settings */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-cream mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-burgundy" />
                Privacy Settings
              </h3>
              <p className="text-cream/60 text-sm mb-4">
                Control how your data is used
              </p>
              {preferencesLoading ? (
                <p className="text-cream/50">Loading preferences...</p>
              ) : (
                <div className="space-y-3">
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

            {/* Data Access & Compliance Actions */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-cream mb-3 flex items-center gap-2">
                <Database className="w-5 h-5 text-burgundy" />
                Data Access & Compliance
              </h3>
              <p className="text-cream/60 text-sm mb-4">
                Access your data and compliance reports
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleDownloadMyData}
                  disabled={complianceLoading}
                  className="w-full flex items-center justify-between p-4 bg-burgundy/10 rounded hover:bg-burgundy/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex items-center gap-3">
                    <FileDown className="w-5 h-5 text-burgundy" />
                    <div className="text-left">
                      <div className="font-medium text-cream">Download My Data (HTML)</div>
                      <div className="text-sm text-cream/60">Export all your personal data (GDPR Article 15)</div>
                    </div>
                  </div>
                  <Download className="w-5 h-5 text-cream/40" />
                </button>

                <div className="text-right">
                  <button
                    onClick={handleDownloadMyDataJSON}
                    disabled={complianceLoading}
                    className="text-sm text-cream/50 hover:text-cream underline transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    or download as JSON
                  </button>
                </div>

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
            </div>

            {/* Policies & Agreements */}
            <div>
              <h3 className="text-lg font-semibold text-cream mb-3 flex items-center gap-2">
                <FileText className="w-5 h-5 text-burgundy" />
                Policies & Agreements
              </h3>
              <p className="text-cream/60 text-sm mb-4">
                Review the legal policies and agreements for Bassline Pilates
              </p>
              <div className="space-y-3">
                {/* Privacy Policy */}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-burgundy/10 rounded hover:bg-burgundy/20 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-burgundy" />
                    <div>
                      <div className="font-medium text-cream">Privacy Policy</div>
                      <div className="text-sm text-cream/60">How we collect, use, and protect your personal data</div>
                    </div>
                  </div>
                  <ChevronUp className="w-5 h-5 text-cream/40 group-hover:text-cream/60 transform rotate-90" />
                </a>

                {/* Beta Tester Agreement */}
                <a
                  href="/beta-agreement"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-burgundy/10 rounded hover:bg-burgundy/20 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-burgundy" />
                    <div>
                      <div className="font-medium text-cream">Beta Tester Agreement</div>
                      <div className="text-sm text-cream/60">Terms and conditions for beta testing participation</div>
                    </div>
                  </div>
                  <ChevronUp className="w-5 h-5 text-cream/40 group-hover:text-cream/60 transform rotate-90" />
                </a>

                {/* Security Overview */}
                <a
                  href="/security"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-burgundy/10 rounded hover:bg-burgundy/20 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-burgundy" />
                    <div>
                      <div className="font-medium text-cream">Security Overview</div>
                      <div className="text-sm text-cream/60">Our security practices and compliance measures</div>
                    </div>
                  </div>
                  <ChevronUp className="w-5 h-5 text-cream/40 group-hover:text-cream/60 transform rotate-90" />
                </a>

                {/* Data Handling During Beta */}
                <a
                  href="/data-during-beta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-burgundy/10 rounded hover:bg-burgundy/20 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-burgundy" />
                    <div>
                      <div className="font-medium text-cream">Data Handling During Beta</div>
                      <div className="text-sm text-cream/60">How we handle your data during beta testing</div>
                    </div>
                  </div>
                  <ChevronUp className="w-5 h-5 text-cream/40 group-hover:text-cream/60 transform rotate-90" />
                </a>

                {/* Health & Safety Disclaimer */}
                <a
                  href="/safety"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-4 bg-burgundy/10 rounded hover:bg-burgundy/20 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-burgundy" />
                    <div>
                      <div className="font-medium text-cream">Health & Safety Disclaimer</div>
                      <div className="text-sm text-cream/60">Important safety information for using the platform</div>
                    </div>
                  </div>
                  <ChevronUp className="w-5 h-5 text-cream/40 group-hover:text-cream/60 transform rotate-90" />
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Developer Tools */}
      <div className="bg-charcoal rounded-lg mb-4 border-2 border-cream/10">
        <button
          onClick={() => toggleSection('developer')}
          className="w-full flex items-center justify-between p-6 hover:bg-cream/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Wrench className="w-6 h-6 text-burgundy" />
            <h2 className="text-xl font-semibold text-cream">Developer Tools</h2>
          </div>
          {expandedSections.developer ? (
            <ChevronUp className="w-5 h-5 text-cream/60" />
          ) : (
            <ChevronDown className="w-5 h-5 text-cream/60" />
          )}
        </button>

        {expandedSections.developer && (
          <div className="px-6 pb-6">
            <p className="text-cream/60 text-sm mb-6">
              Tools for content creators and developers
            </p>
            <DebugPanel />
            <div className="mt-6">
              <RecordingModeManager />
            </div>
          </div>
        )}
      </div>

      {/* Beta Tester Feedback Link */}
      <div className="my-8 text-center">
        <button
          onClick={() => navigate('/beta-feedback')}
          className="inline-flex items-center gap-3 bg-burgundy hover:bg-burgundy/90 text-cream px-6 py-4 rounded-lg font-semibold transition-smooth shadow-lg hover:shadow-xl"
        >
          <MessageSquare className="w-6 h-6" />
          <span>Beta Tester Feedback & Queries</span>
        </button>
        <p className="text-cream/60 text-sm mt-3">
          Share your experience, report issues, or ask questions about Bassline Pilates
        </p>
      </div>

      {/* Danger Zone - Delete Account */}
      <div className="bg-red-900/20 border-2 border-red-500/30 rounded-lg">
        <button
          onClick={() => toggleSection('danger')}
          className="w-full flex items-center justify-between p-6 hover:bg-red-900/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <h2 className="text-xl font-semibold text-red-400">Danger Zone</h2>
          </div>
          {expandedSections.danger ? (
            <ChevronUp className="w-5 h-5 text-red-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-red-400" />
          )}
        </button>

        {expandedSections.danger && (
          <div className="px-6 pb-6">
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
        )}
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

      {/* Compliance Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-0 md:p-4 z-[60] overflow-hidden">
          <div className="bg-charcoal rounded-none md:rounded-lg shadow-2xl w-full h-full md:max-w-6xl md:max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-cream/20 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6 text-burgundy" />
                <h2 className="text-xl md:text-2xl font-bold text-cream">
                  {reportType === 'dpia' && 'My Data Report (GDPR Article 15)'}
                  {reportType === 'ropa' && 'Processing Activities (GDPR Article 30)'}
                  {reportType === 'ai' && 'AI Decisions (EU AI Act)'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setReportContent('');
                }}
                className="text-cream/60 hover:text-cream transition-colors p-2"
                aria-label="Close report"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content - Scrollable Report */}
            <div className="flex-1 overflow-auto p-4 md:p-6 bg-white">
              <div
                className="prose prose-sm md:prose max-w-none"
                dangerouslySetInnerHTML={{ __html: reportContent }}
                style={{
                  fontSize: '14px',
                  lineHeight: '1.6',
                  overflowX: 'auto'
                }}
              />
            </div>

            {/* Modal Footer - Download Option */}
            <div className="flex items-center justify-between p-4 md:p-6 border-t border-cream/20 bg-charcoal/95 flex-shrink-0">
              <p className="text-cream/60 text-sm">
                {reportType === 'dpia' && 'Your personal data export (GDPR compliant)'}
                {reportType === 'ropa' && 'Record of processing activities'}
                {reportType === 'ai' && 'Transparency report for AI decisions'}
              </p>
              <button
                onClick={() => {
                  // Download HTML file as fallback option
                  const dataBlob = new Blob([reportContent], { type: 'text/html' });
                  const url = URL.createObjectURL(dataBlob);
                  const link = document.createElement('a');
                  link.href = url;
                  const filename = reportType === 'dpia'
                    ? `bassline-my-data-${new Date().toISOString().split('T')[0]}.html`
                    : reportType === 'ropa'
                    ? `bassline-processing-activities-${new Date().toISOString().split('T')[0]}.html`
                    : `bassline-ai-decisions-${new Date().toISOString().split('T')[0]}.html`;
                  link.download = filename;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }}
                className="flex items-center gap-2 bg-burgundy hover:bg-burgundy/90 text-cream px-4 py-2 rounded font-semibold transition-smooth"
              >
                <Download className="w-4 h-4" />
                Download HTML
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
