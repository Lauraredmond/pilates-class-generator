import { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, Clock, XCircle, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface BetaFeedback {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  country: string | null;
  feedback_type: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
  updated_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
}

interface FeedbackStats {
  total: number;
  by_status: {
    new: number;
    in_progress: number;
    resolved: number;
  };
  by_type: Record<string, number>;
  recent_count_24h: number;
  recent_count_7d: number;
}

export function BetaFeedbackDashboard() {
  const [feedback, setFeedback] = useState<BetaFeedback[]>([]);
  const [stats, setStats] = useState<FeedbackStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [expandedFeedbackId, setExpandedFeedbackId] = useState<string | null>(null);

  // Admin notes/status update state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchFeedback();
    fetchStats();
  }, [filterStatus]);

  const fetchFeedback = async () => {
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const url = filterStatus
        ? `${API_BASE_URL}/api/admin/beta-feedback?status=${filterStatus}`
        : `${API_BASE_URL}/api/admin/beta-feedback`;

      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFeedback(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`${API_BASE_URL}/api/admin/beta-feedback/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (err) {
      // Stats are optional - don't show error
      console.error('Failed to fetch stats:', err);
    }
  };

  const updateFeedback = async (id: string, status: string, notes: string) => {
    setUpdating(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      await axios.patch(
        `${API_BASE_URL}/api/admin/beta-feedback/${id}`,
        { status, admin_notes: notes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess('Feedback updated successfully');
      setEditingId(null);
      fetchFeedback();
      fetchStats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update feedback');
    } finally {
      setUpdating(false);
    }
  };

  const deleteFeedback = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback? This cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      await axios.delete(`${API_BASE_URL}/api/admin/beta-feedback/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSuccess('Feedback deleted');
      fetchFeedback();
      fetchStats();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete feedback');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-900/20 text-blue-400 border-blue-500/30';
      case 'in_progress':
        return 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30';
      case 'resolved':
        return 'bg-green-900/20 text-green-400 border-green-500/30';
      default:
        return 'bg-cream/10 text-cream/60 border-cream/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Clock className="w-4 h-4" />;
      case 'in_progress':
        return <Clock className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <XCircle className="w-4 h-4" />;
    }
  };

  return (
    <div className="mb-6 p-4 bg-burgundy/10 rounded-lg border border-burgundy/20">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-cream mb-2 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-burgundy" />
            Beta Feedback Dashboard
          </h3>
          <p className="text-cream/60 text-sm mb-3">
            View and manage beta tester feedback submissions
          </p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-3 mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Stats Summary */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-burgundy/20 p-3 rounded">
            <p className="text-xs text-cream/60 mb-1">Total Feedback</p>
            <p className="text-2xl font-bold text-cream">{stats.total}</p>
          </div>
          <div className="bg-blue-900/20 p-3 rounded border border-blue-500/30">
            <p className="text-xs text-blue-400 mb-1">New</p>
            <p className="text-2xl font-bold text-blue-400">{stats.by_status.new}</p>
          </div>
          <div className="bg-yellow-900/20 p-3 rounded border border-yellow-500/30">
            <p className="text-xs text-yellow-400 mb-1">In Progress</p>
            <p className="text-2xl font-bold text-yellow-400">{stats.by_status.in_progress}</p>
          </div>
          <div className="bg-green-900/20 p-3 rounded border border-green-500/30">
            <p className="text-xs text-green-400 mb-1">Resolved</p>
            <p className="text-2xl font-bold text-green-400">{stats.by_status.resolved}</p>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-cream mb-2">Filter by Status</label>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="w-full px-4 py-2 bg-burgundy/20 border border-cream/20 rounded text-cream focus:outline-none focus:ring-2 focus:ring-burgundy"
        >
          <option value="">All Feedback</option>
          <option value="new">New Only</option>
          <option value="in_progress">In Progress Only</option>
          <option value="resolved">Resolved Only</option>
        </select>
      </div>

      {/* Feedback List */}
      {loading ? (
        <p className="text-cream/50 text-center py-4">Loading feedback...</p>
      ) : feedback.length === 0 ? (
        <p className="text-cream/50 text-center py-4">No feedback submissions yet</p>
      ) : (
        <div className="space-y-3">
          {feedback.map((item) => (
            <div key={item.id} className="bg-charcoal rounded border border-cream/20 overflow-hidden">
              {/* Feedback Header */}
              <button
                onClick={() => setExpandedFeedbackId(expandedFeedbackId === item.id ? null : item.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-cream/5 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1 text-left">
                  <div className={`px-2 py-1 rounded border text-xs font-semibold flex items-center gap-1 ${getStatusColor(item.status)}`}>
                    {getStatusIcon(item.status)}
                    {item.status}
                  </div>
                  <div className="flex-1">
                    <p className="text-cream font-semibold">{item.subject}</p>
                    <p className="text-cream/60 text-sm">
                      {item.name} ({item.email}) • {item.feedback_type}
                    </p>
                    <p className="text-cream/50 text-xs">
                      {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {expandedFeedbackId === item.id ? (
                  <ChevronUp className="w-5 h-5 text-cream/40" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-cream/40" />
                )}
              </button>

              {/* Feedback Details (Expanded) */}
              {expandedFeedbackId === item.id && (
                <div className="p-4 border-t border-cream/20 space-y-4">
                  {/* Message */}
                  <div>
                    <p className="text-xs text-cream/60 mb-1">Message:</p>
                    <p className="text-cream/90 text-sm whitespace-pre-wrap">{item.message}</p>
                  </div>

                  {/* Country */}
                  {item.country && (
                    <div>
                      <p className="text-xs text-cream/60 mb-1">Country:</p>
                      <p className="text-cream/90 text-sm">{item.country}</p>
                    </div>
                  )}

                  {/* Admin Notes (if exists) */}
                  {item.admin_notes && !editingId && (
                    <div className="bg-burgundy/10 p-3 rounded">
                      <p className="text-xs text-cream/60 mb-1">Admin Notes:</p>
                      <p className="text-cream/90 text-sm whitespace-pre-wrap">{item.admin_notes}</p>
                      {item.reviewed_at && (
                        <p className="text-xs text-cream/50 mt-2">
                          Reviewed: {new Date(item.reviewed_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Edit Form */}
                  {editingId === item.id ? (
                    <div className="bg-burgundy/10 p-3 rounded space-y-3">
                      <div>
                        <label className="block text-xs text-cream/60 mb-1">Status:</label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="w-full px-3 py-2 bg-burgundy/20 border border-cream/20 rounded text-cream text-sm"
                        >
                          <option value="new">New</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-cream/60 mb-1">Admin Notes:</label>
                        <textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 bg-burgundy/20 border border-cream/20 rounded text-cream text-sm"
                          placeholder="Add notes about this feedback..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditStatus('');
                            setEditNotes('');
                          }}
                          disabled={updating}
                          className="flex-1 bg-cream/10 hover:bg-cream/20 text-cream px-3 py-2 rounded text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => updateFeedback(item.id, editStatus, editNotes)}
                          disabled={updating}
                          className="flex-1 bg-burgundy hover:bg-burgundy/90 text-cream px-3 py-2 rounded text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                          {updating ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingId(item.id);
                          setEditStatus(item.status);
                          setEditNotes(item.admin_notes || '');
                        }}
                        className="flex-1 bg-burgundy hover:bg-burgundy/90 text-cream px-3 py-2 rounded text-sm font-semibold transition-colors"
                      >
                        Update Status/Notes
                      </button>
                      <button
                        onClick={() => deleteFeedback(item.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm font-semibold transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
