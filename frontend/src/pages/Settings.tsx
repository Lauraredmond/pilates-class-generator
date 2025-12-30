import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Trash2, AlertTriangle, Key, CheckCircle, Bell, Shield, Settings as SettingsIcon, FileDown, Info, Database, Download, ChevronDown, ChevronUp, X, MessageSquare, FileText, Wrench } from 'lucide-react';
import { logger } from '../utils/logger';
import { RecordingModeManager } from '../components/recording-mode/RecordingModeManager';
import { DebugPanel } from '../components/DebugPanel';
import { EarlySkipAnalytics } from '../components/settings/EarlySkipAnalytics';

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

  // Class sequencing report state
  const [sequencingReportLoading, setSequencingReportLoading] = useState(false);
  const [sequencingReportError, setSequencingReportError] = useState('');
  const [sequencingReportSuccess, setSequencingReportSuccess] = useState('');

  // Class plan ID report state (for specific class_plan_id lookup)
  const [classPlanIdInput, setClassPlanIdInput] = useState('');
  const [classPlanReportLoading, setClassPlanReportLoading] = useState(false);
  const [classPlanReportError, setClassPlanReportError] = useState('');
  const [classPlanReportSuccess, setClassPlanReportSuccess] = useState('');

  // Creators vs Performers report state
  const [creatorsReportLoading, setCreatorsReportLoading] = useState(false);
  const [creatorsReportError, setCreatorsReportError] = useState('');
  const [creatorsReportData, setCreatorsReportData] = useState<any>(null);

  // Creators vs Performers user drilldown state
  const [selectedCategory, setSelectedCategory] = useState<string>('creators_only');
  const [usersData, setUsersData] = useState<any>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [usersOffset, setUsersOffset] = useState(0);
  const [usersLimit] = useState(50);

  // Quality tracking state
  const [qualityTrendsLoading, setQualityTrendsLoading] = useState(false);
  const [qualityTrendsError, setQualityTrendsError] = useState('');
  const [qualityTrendsData, setQualityTrendsData] = useState<any>(null);
  const [qualityLogsData, setQualityLogsData] = useState<any[]>([]);

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

  const handleDownloadSequencingReport = async () => {
    setSequencingReportLoading(true);
    setSequencingReportError('');
    setSequencingReportSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/api/analytics/class-sequencing-report/${user?.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Download markdown file
      const reportData = response.data;
      const dataBlob = new Blob([reportData.report_content], { type: 'text/markdown' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `class-sequencing-report-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const passStatus = reportData.pass_status ? 'PASSED' : 'FAILED';
      setSequencingReportSuccess(`Report downloaded successfully! Sequencing validation: ${passStatus} (${reportData.total_movements} movements)`);
      setTimeout(() => setSequencingReportSuccess(''), 10000);
    } catch (error: any) {
      if (error.response?.status === 404) {
        setSequencingReportError('No class history found. Generate a class first to see the sequencing report.');
      } else {
        setSequencingReportError(error.response?.data?.detail || 'Failed to generate sequencing report');
      }
    } finally {
      setSequencingReportLoading(false);
    }
  };

  const handleDownloadClassPlanReport = async () => {
    if (!classPlanIdInput.trim()) {
      setClassPlanReportError('Please enter a class plan ID');
      return;
    }

    setClassPlanReportLoading(true);
    setClassPlanReportError('');
    setClassPlanReportSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/api/analytics/sequencing-report/${classPlanIdInput.trim()}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Download markdown file
      const reportData = response.data;
      const dataBlob = new Blob([reportData.report_content], { type: 'text/markdown' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sequencing-report-${classPlanIdInput.trim()}-${new Date().toISOString().split('T')[0]}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const passStatus = reportData.pass_status ? 'PASSED' : 'FAILED';
      setClassPlanReportSuccess(`Report downloaded! Sequencing: ${passStatus} (${reportData.total_movements} movements)`);
      setTimeout(() => setClassPlanReportSuccess(''), 10000);
      setClassPlanIdInput(''); // Clear input after success
    } catch (error: any) {
      if (error.response?.status === 404) {
        setClassPlanReportError('No report found for this class plan ID. The report may still be generating, or the ID may be invalid.');
      } else {
        setClassPlanReportError(error.response?.data?.detail || 'Failed to fetch report');
      }
    } finally {
      setClassPlanReportLoading(false);
    }
  };

  const handleViewCreatorsReport = async () => {
    setCreatorsReportLoading(true);
    setCreatorsReportError('');
    setCreatorsReportData(null);

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(
        `${API_BASE_URL}/api/analytics/admin/creators-vs-performers?admin_user_id=${user?.id}&period=month`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCreatorsReportData(response.data);
    } catch (error: any) {
      setCreatorsReportError(error.response?.data?.detail || 'Failed to load report');
    } finally {
      setCreatorsReportLoading(false);
    }
  };

  const handleFetchUsers = async (category: string, offset: number = 0) => {
    setUsersLoading(true);
    setUsersError('');

    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(
        `${API_BASE_URL}/api/analytics/admin/creators-vs-performers/users?admin_user_id=${user?.id}&category=${category}&limit=${usersLimit}&offset=${offset}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsersData(response.data);
      setUsersOffset(offset);
    } catch (error: any) {
      setUsersError(error.response?.data?.detail || 'Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleViewQualityTracking = async () => {
    setQualityTrendsLoading(true);
    setQualityTrendsError('');
    setQualityTrendsData(null);
    setQualityLogsData([]);

    try {
      const token = localStorage.getItem('access_token');

      // Fetch both trends and recent logs for ALL users (admin feature)
      const [trendsResponse, logsResponse] = await Promise.all([
        axios.get(
          `${API_BASE_URL}/api/analytics/quality-trends?period=week`,
          { headers: { Authorization: `Bearer ${token}` } }
        ),
        axios.get(
          `${API_BASE_URL}/api/analytics/quality-logs?limit=10`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      ]);

      setQualityTrendsData(trendsResponse.data);
      setQualityLogsData(logsResponse.data);
    } catch (error: any) {
      setQualityTrendsError(error.response?.data?.detail || 'Failed to load quality tracking data');
    } finally {
      setQualityTrendsLoading(false);
    }
  };

  const handleDownloadQualityCSV = async () => {
    setQualityTrendsLoading(true);
    setQualityTrendsError('');

    try {
      const token = localStorage.getItem('access_token');

      // Fetch ALL quality logs for ALL users (not just 10 for display)
      const response = await axios.get(
        `${API_BASE_URL}/api/analytics/quality-logs?limit=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const logs = response.data;

      // Convert to CSV format with 16 columns (added User Email)
      const headers = [
        'User Email',
        'ID',
        'Generated At',
        'Difficulty Level',
        'Movement Count',
        'Rule 1: Muscle Repetition (Pass)',
        'Rule 1: Max Overlap %',
        'Rule 1: Failed Pairs',
        'Rule 2: Family Balance (Pass)',
        'Rule 2: Max Family %',
        'Rule 2: Overrepresented Families',
        'Rule 3: Repertoire Coverage (Pass)',
        'Rule 3: Unique Movements',
        'Rule 3: Stalest Movement (Days)',
        'Overall Pass',
        'Quality Score'
      ].join(',');

      const rows = logs.map((log: any) => [
        log.user_email || 'Unknown',
        log.class_plan_id,  // FIX: Use class_plan_id for reconciliation with sequencing report
        log.generated_at,
        log.difficulty_level,
        log.movement_count,
        log.rule1_muscle_repetition_pass ? 'PASS' : 'FAIL',
        log.rule1_max_consecutive_overlap_pct || '',
        log.rule1_failed_pairs ? `"${JSON.stringify(log.rule1_failed_pairs).replace(/"/g, '""')}"` : '',
        log.rule2_family_balance_pass ? 'PASS' : 'FAIL',
        log.rule2_max_family_pct || '',
        log.rule2_overrepresented_families ? `"${JSON.stringify(log.rule2_overrepresented_families).replace(/"/g, '""')}"` : '',
        log.rule3_repertoire_coverage_pass ? 'PASS' : 'FAIL',
        log.rule3_unique_movements_count || '',
        log.rule3_stalest_movement_days || '',
        log.overall_pass ? 'PASS' : 'FAIL',
        log.quality_score || ''
      ].join(','));

      const csv = [headers, ...rows].join('\n');

      // Download CSV file
      const dataBlob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `quality-tracking-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setPreferencesSuccess('Quality tracking data exported as CSV');
      setTimeout(() => setPreferencesSuccess(''), 5000);
    } catch (error: any) {
      setQualityTrendsError(error.response?.data?.detail || 'Failed to export CSV');
    } finally {
      setQualityTrendsLoading(false);
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

      {/* Developer Tools - Admin Only */}
      {user?.is_admin && (
        <div className="bg-charcoal rounded-lg mb-4 border-2 border-cream/10">
          <button
            onClick={() => toggleSection('developer')}
            className="w-full flex items-center justify-between p-6 hover:bg-cream/5 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Wrench className="w-6 h-6 text-burgundy" />
              <h2 className="text-xl font-semibold text-cream flex items-center gap-2">
                Developer Tools
                <span className="text-xs bg-burgundy px-2 py-0.5 rounded text-cream/90">Admin Only</span>
              </h2>
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

            {/* Sequencing Report Success/Error Messages */}
            {sequencingReportSuccess && (
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                <p className="text-green-400 text-sm">{sequencingReportSuccess}</p>
              </div>
            )}

            {sequencingReportError && (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                <p className="text-sm text-red-700">{sequencingReportError}</p>
              </div>
            )}

            {/* Class Sequencing Report Download */}
            <div className="mb-6 p-4 bg-burgundy/10 rounded-lg border border-burgundy/20">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-cream mb-2">Class Sequencing Report</h3>
                  <p className="text-cream/60 text-sm mb-3">
                    Download a detailed report analyzing your most recent class for proper sequencing rules:
                  </p>
                  <ul className="text-cream/60 text-xs space-y-1 list-disc list-inside mb-3">
                    <li>Movement sequence data with muscle groups</li>
                    <li>Consecutive muscle overlap analysis (must be &lt;50%)</li>
                    <li>Movement pattern proximity checks</li>
                    <li>Historical muscle balance tracking</li>
                    <li>Summary statistics with pass/fail status</li>
                  </ul>
                </div>
              </div>
              <button
                onClick={handleDownloadSequencingReport}
                disabled={sequencingReportLoading}
                className="w-full flex items-center justify-center gap-2 bg-burgundy hover:bg-burgundy/90 text-cream px-4 py-3 rounded font-semibold transition-smooth disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-5 h-5" />
                {sequencingReportLoading ? 'Generating Report...' : 'Download Latest Class Report (.md)'}
              </button>
            </div>

            {/* Generate Report by Class Plan ID */}
            <div className="mb-6 p-4 bg-burgundy/10 rounded-lg border border-burgundy/20">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-cream mb-2">Generate Report by Class Plan ID</h3>
                  <p className="text-cream/60 text-sm mb-3">
                    Enter a specific class plan ID to download its sequencing report:
                  </p>
                </div>
              </div>

              {classPlanReportSuccess && (
                <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                  <p className="text-green-400 text-sm">{classPlanReportSuccess}</p>
                </div>
              )}

              {classPlanReportError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                  <p className="text-sm text-red-700">{classPlanReportError}</p>
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={classPlanIdInput}
                  onChange={(e) => setClassPlanIdInput(e.target.value)}
                  placeholder="Enter class plan ID (UUID)"
                  className="flex-1 px-4 py-3 bg-burgundy/20 border border-cream/20 rounded text-cream placeholder-cream/40 focus:outline-none focus:ring-2 focus:ring-burgundy"
                  disabled={classPlanReportLoading}
                />
                <button
                  onClick={handleDownloadClassPlanReport}
                  disabled={classPlanReportLoading || !classPlanIdInput.trim()}
                  className="flex items-center justify-center gap-2 bg-burgundy hover:bg-burgundy/90 text-cream px-6 py-3 rounded font-semibold transition-smooth disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  <Download className="w-5 h-5" />
                  {classPlanReportLoading ? 'Fetching...' : 'Download Report'}
                </button>
              </div>
            </div>

            {/* Creators vs Performers Report */}
            <div className="mb-6 p-4 bg-burgundy/10 rounded-lg border border-burgundy/20">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-cream mb-2">Creators vs Performers Report</h3>
                  <p className="text-cream/60 text-sm mb-3">
                    View analytics comparing users who create classes vs those who actually perform them (qualified plays {'>'}  120 seconds):
                  </p>
                  <ul className="text-cream/60 text-xs space-y-1 list-disc list-inside mb-3">
                    <li>Total users by category (creators-only, performers-only, both)</li>
                    <li>Engagement rates and conversion metrics</li>
                    <li>Historical time series data</li>
                    <li>Play session qualification threshold: 120 seconds</li>
                  </ul>
                </div>
              </div>

              {creatorsReportError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-3">
                  <p className="text-sm text-red-700">{creatorsReportError}</p>
                </div>
              )}

              <button
                onClick={handleViewCreatorsReport}
                disabled={creatorsReportLoading}
                className="w-full flex items-center justify-center gap-2 bg-burgundy hover:bg-burgundy/90 text-cream px-4 py-3 rounded font-semibold transition-smooth disabled:opacity-50 disabled:cursor-not-allowed mb-3"
              >
                <Database className="w-5 h-5" />
                {creatorsReportLoading ? 'Loading Report...' : 'View Report'}
              </button>

              {creatorsReportData && (
                <div className="mt-4 p-4 bg-charcoal rounded border border-cream/20">
                  <h4 className="text-md font-semibold text-cream mb-3">Report Summary</h4>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-burgundy/20 p-3 rounded">
                      <p className="text-xs text-cream/60 mb-1">Total Users</p>
                      <p className="text-2xl font-bold text-cream">{creatorsReportData.total_users}</p>
                    </div>
                    <div className="bg-burgundy/20 p-3 rounded">
                      <p className="text-xs text-cream/60 mb-1">Creators Only</p>
                      <p className="text-2xl font-bold text-cream">{creatorsReportData.creators_only}</p>
                      <p className="text-xs text-cream/50 mt-1">Create but never play</p>
                    </div>
                    <div className="bg-burgundy/20 p-3 rounded">
                      <p className="text-xs text-cream/60 mb-1">Performers Only</p>
                      <p className="text-2xl font-bold text-cream">{creatorsReportData.performers_only}</p>
                      <p className="text-xs text-cream/50 mt-1">Play but never create</p>
                    </div>
                    <div className="bg-burgundy/20 p-3 rounded">
                      <p className="text-xs text-cream/60 mb-1">Both Create & Perform</p>
                      <p className="text-2xl font-bold text-cream">{creatorsReportData.both}</p>
                      <p className="text-xs text-cream/50 mt-1">Full engagement</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-900/20 p-3 rounded border border-green-500/30">
                      <p className="text-xs text-green-400 mb-1">Creator Engagement Rate</p>
                      <p className="text-xl font-bold text-green-400">{creatorsReportData.creator_engagement_rate.toFixed(1)}%</p>
                      <p className="text-xs text-cream/50 mt-1">Creators who also perform</p>
                    </div>
                    <div className="bg-blue-900/20 p-3 rounded border border-blue-500/30">
                      <p className="text-xs text-blue-400 mb-1">Performer Creation Rate</p>
                      <p className="text-xl font-bold text-blue-400">{creatorsReportData.performer_creation_rate.toFixed(1)}%</p>
                      <p className="text-xs text-cream/50 mt-1">Performers who also create</p>
                    </div>
                  </div>
                </div>
              )}

              {/* User Drilldown - Show after report loaded */}
              {creatorsReportData && (
                <div className="mt-4 p-4 bg-charcoal rounded border border-cream/20">
                  <h4 className="text-md font-semibold text-cream mb-3">User Breakdown by Category</h4>

                  {/* Category Selector */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-cream mb-2">Select Category</label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        handleFetchUsers(e.target.value, 0);
                      }}
                      className="w-full px-4 py-2 bg-burgundy/20 border border-cream/20 rounded text-cream focus:outline-none focus:ring-2 focus:ring-burgundy"
                    >
                      <option value="creators_only">Creators Only ({creatorsReportData.creators_only})</option>
                      <option value="performers_only">Performers Only ({creatorsReportData.performers_only})</option>
                      <option value="both">Both Create & Perform ({creatorsReportData.both})</option>
                    </select>
                  </div>

                  {/* Errors */}
                  {usersError && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-3">
                      <p className="text-sm text-red-700">{usersError}</p>
                    </div>
                  )}

                  {/* Load Users Button */}
                  {!usersData && (
                    <button
                      onClick={() => handleFetchUsers(selectedCategory, 0)}
                      disabled={usersLoading}
                      className="w-full flex items-center justify-center gap-2 bg-burgundy hover:bg-burgundy/90 text-cream px-4 py-2 rounded font-semibold transition-smooth disabled:opacity-50 disabled:cursor-not-allowed mb-3"
                    >
                      <Database className="w-5 h-5" />
                      {usersLoading ? 'Loading Users...' : 'Load Users'}
                    </button>
                  )}

                  {/* User Table */}
                  {usersData && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm mb-4">
                        <thead className="bg-burgundy/20">
                          <tr>
                            <th className="text-left p-2 text-cream">Email</th>
                            <th className="text-center p-2 text-cream">Classes Created</th>
                            <th className="text-center p-2 text-cream">Completed Plays</th>
                            <th className="text-left p-2 text-cream">Last Activity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {usersData.users.map((user: any) => (
                            <tr key={user.user_id} className="border-b border-cream/10">
                              <td className="p-2 text-cream/70">{user.email || 'N/A'}</td>
                              <td className="p-2 text-center text-cream/70">{user.created_classes_count}</td>
                              <td className="p-2 text-center text-cream/70">{user.completed_plays_count}</td>
                              <td className="p-2 text-cream/70 text-xs">
                                {user.last_activity_at ? new Date(user.last_activity_at).toLocaleString() : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* Pagination Info */}
                      <div className="flex items-center justify-between text-sm text-cream/60 mb-3">
                        <p>
                          Showing {usersOffset + 1}-{Math.min(usersOffset + usersLimit, usersData.total_count)} of {usersData.total_count} users
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleFetchUsers(selectedCategory, Math.max(0, usersOffset - usersLimit))}
                            disabled={usersLoading || usersOffset === 0}
                            className="px-3 py-1 bg-burgundy/20 hover:bg-burgundy/30 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => handleFetchUsers(selectedCategory, usersOffset + usersLimit)}
                            disabled={usersLoading || !usersData.has_more}
                            className="px-3 py-1 bg-burgundy/20 hover:bg-burgundy/30 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Quality Tracking Dashboard */}
            <div className="mb-6 p-4 bg-burgundy/10 rounded-lg border border-burgundy/20">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-cream mb-2">Quality Tracking Dashboard</h3>
                  <p className="text-cream/60 text-sm mb-3">
                    Monitor the three golden rules for class quality across your generated classes:
                  </p>
                  <ul className="text-cream/60 text-xs space-y-1 list-disc list-inside mb-3">
                    <li><strong>Rule 1:</strong> Muscle repetition - consecutive movements &lt;50% overlap</li>
                    <li><strong>Rule 2:</strong> Family balance - no family &gt;40% of class</li>
                    <li><strong>Rule 3:</strong> Repertoire coverage - full historical lookback</li>
                  </ul>
                </div>
              </div>

              {qualityTrendsError && (
                <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-3">
                  <p className="text-sm text-red-700">{qualityTrendsError}</p>
                </div>
              )}

              <button
                onClick={handleViewQualityTracking}
                disabled={qualityTrendsLoading}
                className="w-full flex items-center justify-center gap-2 bg-burgundy hover:bg-burgundy/90 text-cream px-4 py-3 rounded font-semibold transition-smooth disabled:opacity-50 disabled:cursor-not-allowed mb-3"
              >
                <Database className="w-5 h-5" />
                {qualityTrendsLoading ? 'Loading Quality Data...' : 'View Quality Tracking'}
              </button>

              <button
                onClick={handleDownloadQualityCSV}
                disabled={qualityTrendsLoading}
                className="w-full flex items-center justify-center gap-2 bg-cream/10 hover:bg-cream/20 text-cream px-4 py-2 rounded font-semibold transition-smooth disabled:opacity-50 disabled:cursor-not-allowed mb-3"
              >
                <Download className="w-4 h-4" />
                {qualityTrendsLoading ? 'Exporting CSV...' : 'Export Quality Data (CSV)'}
              </button>

              {qualityTrendsData && (
                <div className="mt-4 space-y-4">
                  {/* Overall Summary */}
                  <div className="p-4 bg-charcoal rounded border border-cream/20">
                    <h4 className="text-md font-semibold text-cream mb-3">Overall Quality Summary</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-burgundy/20 p-3 rounded">
                        <p className="text-xs text-cream/60 mb-1">Total Classes Tracked</p>
                        <p className="text-2xl font-bold text-cream">{qualityTrendsData.total_classes}</p>
                      </div>
                      <div className={`p-3 rounded ${qualityTrendsData.overall_pass_rate >= 80 ? 'bg-green-900/20 border border-green-500/30' : 'bg-red-900/20 border border-red-500/30'}`}>
                        <p className={`text-xs mb-1 ${qualityTrendsData.overall_pass_rate >= 80 ? 'text-green-400' : 'text-red-400'}`}>
                          Overall Pass Rate
                        </p>
                        <p className={`text-2xl font-bold ${qualityTrendsData.overall_pass_rate >= 80 ? 'text-green-400' : 'text-red-400'}`}>
                          {qualityTrendsData.overall_pass_rate.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Rule Pass/Fail Trends */}
                  <div className="p-4 bg-charcoal rounded border border-cream/20">
                    <h4 className="text-md font-semibold text-cream mb-3">Pass/Fail Trends (Last 4 Weeks)</h4>
                    <div className="space-y-4">
                      {/* Rule 1 */}
                      <div>
                        <h5 className="text-sm font-semibold text-cream mb-2">Rule 1: Muscle Repetition</h5>
                        <div className="grid grid-cols-4 gap-2">
                          {qualityTrendsData.period_labels.map((label: string, idx: number) => (
                            <div key={idx} className="bg-burgundy/10 p-2 rounded text-center">
                              <p className="text-xs text-cream/60 mb-1">{label}</p>
                              <p className="text-lg font-bold text-green-400">
                                {qualityTrendsData.rule1_pass_counts[idx]}
                              </p>
                              <p className="text-xs text-cream/50">Pass</p>
                              <p className="text-lg font-bold text-red-400">
                                {qualityTrendsData.rule1_fail_counts[idx]}
                              </p>
                              <p className="text-xs text-cream/50">Fail</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Rule 2 */}
                      <div>
                        <h5 className="text-sm font-semibold text-cream mb-2">Rule 2: Family Balance</h5>
                        <div className="grid grid-cols-4 gap-2">
                          {qualityTrendsData.period_labels.map((label: string, idx: number) => (
                            <div key={idx} className="bg-burgundy/10 p-2 rounded text-center">
                              <p className="text-xs text-cream/60 mb-1">{label}</p>
                              <p className="text-lg font-bold text-green-400">
                                {qualityTrendsData.rule2_pass_counts[idx]}
                              </p>
                              <p className="text-xs text-cream/50">Pass</p>
                              <p className="text-lg font-bold text-red-400">
                                {qualityTrendsData.rule2_fail_counts[idx]}
                              </p>
                              <p className="text-xs text-cream/50">Fail</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Rule 3 */}
                      <div>
                        <h5 className="text-sm font-semibold text-cream mb-2">Rule 3: Repertoire Coverage</h5>
                        <div className="grid grid-cols-4 gap-2">
                          {qualityTrendsData.period_labels.map((label: string, idx: number) => (
                            <div key={idx} className="bg-burgundy/10 p-2 rounded text-center">
                              <p className="text-xs text-cream/60 mb-1">{label}</p>
                              <p className="text-lg font-bold text-green-400">
                                {qualityTrendsData.rule3_pass_counts[idx]}
                              </p>
                              <p className="text-xs text-cream/50">Pass</p>
                              <p className="text-lg font-bold text-red-400">
                                {qualityTrendsData.rule3_fail_counts[idx]}
                              </p>
                              <p className="text-xs text-cream/50">Fail</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recent Quality Logs */}
                  {qualityLogsData.length > 0 && (
                    <div className="p-4 bg-charcoal rounded border border-cream/20">
                      <h4 className="text-md font-semibold text-cream mb-3">Recent Classes (Last 10)</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-burgundy/20">
                            <tr>
                              <th className="text-left p-2 text-cream">Date</th>
                              <th className="text-left p-2 text-cream">Difficulty</th>
                              <th className="text-center p-2 text-cream">Movements</th>
                              <th className="text-center p-2 text-cream">R1</th>
                              <th className="text-center p-2 text-cream">R2</th>
                              <th className="text-center p-2 text-cream">R3</th>
                              <th className="text-center p-2 text-cream">Overall</th>
                            </tr>
                          </thead>
                          <tbody>
                            {qualityLogsData.map((log: any) => (
                              <tr key={log.id} className="border-b border-cream/10">
                                <td className="p-2 text-cream/70 text-xs">
                                  {new Date(log.generated_at).toLocaleDateString()}
                                </td>
                                <td className="p-2 text-cream/70 text-xs">{log.difficulty_level}</td>
                                <td className="p-2 text-center text-cream/70 text-xs">{log.movement_count}</td>
                                <td className="p-2 text-center">
                                  {log.rule1_muscle_repetition_pass ? (
                                    <span className="text-green-400 font-bold">✓</span>
                                  ) : (
                                    <span className="text-red-400 font-bold">✗</span>
                                  )}
                                </td>
                                <td className="p-2 text-center">
                                  {log.rule2_family_balance_pass ? (
                                    <span className="text-green-400 font-bold">✓</span>
                                  ) : (
                                    <span className="text-red-400 font-bold">✗</span>
                                  )}
                                </td>
                                <td className="p-2 text-center">
                                  {log.rule3_repertoire_coverage_pass ? (
                                    <span className="text-green-400 font-bold">✓</span>
                                  ) : (
                                    <span className="text-red-400 font-bold">✗</span>
                                  )}
                                </td>
                                <td className="p-2 text-center">
                                  {log.overall_pass ? (
                                    <span className="text-green-400 font-bold">✓</span>
                                  ) : (
                                    <span className="text-red-400 font-bold">✗</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Early Skip Analytics - December 29, 2025 */}
            <EarlySkipAnalytics userId={user!.id} />

            <DebugPanel />
            <div className="mt-6">
              <RecordingModeManager />
            </div>
          </div>
        )}
      </div>
      )}


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
          <div className="bg-charcoal/95 backdrop-blur-sm rounded-lg shadow-xl max-w-md w-full p-6 border border-cream/20">
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
