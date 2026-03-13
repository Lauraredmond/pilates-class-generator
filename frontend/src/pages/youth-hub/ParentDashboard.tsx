import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardTitle } from '../../components/ui/Card';
import { ArrowLeft, Plus, Calendar, Copy, CheckCircle, User, Activity } from 'lucide-react';
import { youthHubApi } from '../../services/youthHubApi';

interface Youth {
  id: string;
  name: string;
  code: string;
  stats?: {
    teamCount: number;
    activityCount: number;
    sessionCount: number;
  };
}

interface Activity {
  id: string;
  youthCode: string;
  youthName: string;
  activity: string;
  trainingDate: string;
  duration: number;
  recordedAt: string;
}

export function ParentDashboard() {
  const navigate = useNavigate();
  const [youths, setYouths] = useState<Youth[]>([]);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form states
  const [newYouthName, setNewYouthName] = useState('');
  const [activityForm, setActivityForm] = useState({
    youthCode: '',
    activity: '',
    trainingDate: new Date().toISOString().split('T')[0],
    duration: 60
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load youths
      const youthsData = await youthHubApi.getYouths();
      setYouths(youthsData);

      // Load recent activities
      const activitiesData = await youthHubApi.getParentActivities();
      setRecentActivities(activitiesData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterYouth = async () => {
    if (!newYouthName.trim()) return;

    try {
      const youth = await youthHubApi.registerYouth(newYouthName);
      setYouths([youth, ...youths]);
      setNewYouthName('');
      setShowRegisterModal(false);

      // Show success message with code
      alert(`${youth.name} registered successfully!\n\nUnique code: ${youth.code}\n\nShare this code with coaches to allow them to log training sessions.`);
    } catch (error) {
      console.error('Failed to register youth:', error);
      alert('Failed to register youth. Please try again.');
    }
  };

  const handleLogActivity = async () => {
    const { youthCode, activity, trainingDate, duration } = activityForm;

    if (!youthCode || !activity || !trainingDate || !duration) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await youthHubApi.logActivity({
        youthCode,
        activity,
        trainingDate: new Date(trainingDate).toISOString(),
        duration: parseInt(duration.toString())
      });

      setShowActivityModal(false);
      setActivityForm({
        youthCode: '',
        activity: '',
        trainingDate: new Date().toISOString().split('T')[0],
        duration: 60
      });

      // Reload data
      loadData();
    } catch (error) {
      console.error('Failed to log activity:', error);
      alert('Failed to log activity. Please try again.');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const viewTimeline = (youth: Youth) => {
    navigate(`/youth-hub/timeline/${youth.code}`);
  };

  return (
    <div className="min-h-screen bg-burgundy">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/youth-training-hub')}
            className="flex items-center gap-2 text-cream/70 hover:text-cream transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Hub</span>
          </button>
          <h1 className="text-2xl font-bold text-cream">Parent Dashboard</h1>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardBody>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="w-full flex items-center justify-center gap-3 p-4 bg-burgundy text-cream rounded-lg hover:bg-burgundy/90 transition-colors"
              >
                <Plus size={20} />
                <span className="font-semibold">Register New Child</span>
              </button>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <button
                onClick={() => setShowActivityModal(true)}
                className="w-full flex items-center justify-center gap-3 p-4 bg-burgundy text-cream rounded-lg hover:bg-burgundy/90 transition-colors"
                disabled={youths.length === 0}
              >
                <Activity size={20} />
                <span className="font-semibold">Log Activity</span>
              </button>
            </CardBody>
          </Card>
        </div>

        {/* Registered Children */}
        <Card className="mb-6">
          <CardBody>
            <CardTitle className="mb-4">Your Children</CardTitle>
            {loading ? (
              <p className="text-charcoal/60">Loading...</p>
            ) : youths.length === 0 ? (
              <div className="text-center py-8">
                <User className="w-16 h-16 text-charcoal/30 mx-auto mb-4" />
                <p className="text-charcoal/60 mb-4">No children registered yet</p>
                <Button onClick={() => setShowRegisterModal(true)} variant="primary">
                  Register Your First Child
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {youths.map((youth) => (
                  <div key={youth.id} className="bg-white rounded-lg p-4 border border-charcoal/10">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-burgundy">{youth.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-charcoal/60">Code:</span>
                          <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                            {youth.code}
                          </code>
                          <button
                            onClick={() => copyCode(youth.code)}
                            className="text-burgundy hover:text-burgundy/80"
                          >
                            {copiedCode === youth.code ? (
                              <CheckCircle size={16} />
                            ) : (
                              <Copy size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {youth.stats && (
                      <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                        <div className="text-center">
                          <div className="font-semibold text-burgundy">{youth.stats.teamCount}</div>
                          <div className="text-charcoal/60">Teams</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-burgundy">{youth.stats.sessionCount}</div>
                          <div className="text-charcoal/60">Sessions</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-burgundy">{youth.stats.activityCount}</div>
                          <div className="text-charcoal/60">Activities</div>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={() => viewTimeline(youth)}
                      variant="ghost"
                      className="w-full text-sm"
                    >
                      <Calendar size={16} className="mr-2" />
                      View Timeline
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardBody>
            <CardTitle className="mb-4">Recent Activities</CardTitle>
            {recentActivities.length === 0 ? (
              <p className="text-charcoal/60 text-center py-4">No activities logged yet</p>
            ) : (
              <div className="space-y-2">
                {recentActivities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-burgundy">{activity.youthName}</span>
                        <span className="text-charcoal/60">•</span>
                        <span className="text-charcoal">{activity.activity}</span>
                      </div>
                      <div className="text-sm text-charcoal/60 mt-1">
                        {new Date(activity.trainingDate).toLocaleDateString()} • {activity.duration} mins
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Register Youth Modal */}
        {showRegisterModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-burgundy mb-4">Register New Child</h2>
              <input
                type="text"
                value={newYouthName}
                onChange={(e) => setNewYouthName(e.target.value)}
                placeholder="Enter child's name"
                className="w-full p-3 border border-charcoal/20 rounded-lg mb-4"
                autoFocus
              />
              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setShowRegisterModal(false);
                    setNewYouthName('');
                  }}
                  variant="ghost"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRegisterYouth}
                  variant="primary"
                  className="flex-1"
                  disabled={!newYouthName.trim()}
                >
                  Register
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Log Activity Modal */}
        {showActivityModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-burgundy mb-4">Log Activity</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Child</label>
                  <select
                    value={activityForm.youthCode}
                    onChange={(e) => setActivityForm({ ...activityForm, youthCode: e.target.value })}
                    className="w-full p-3 border border-charcoal/20 rounded-lg"
                  >
                    <option value="">Select child</option>
                    {youths.map((youth) => (
                      <option key={youth.code} value={youth.code}>
                        {youth.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Activity</label>
                  <input
                    type="text"
                    value={activityForm.activity}
                    onChange={(e) => setActivityForm({ ...activityForm, activity: e.target.value })}
                    placeholder="e.g., Swimming, Dance, Martial Arts"
                    className="w-full p-3 border border-charcoal/20 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Date</label>
                  <input
                    type="date"
                    value={activityForm.trainingDate}
                    onChange={(e) => setActivityForm({ ...activityForm, trainingDate: e.target.value })}
                    className="w-full p-3 border border-charcoal/20 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    value={activityForm.duration}
                    onChange={(e) => setActivityForm({ ...activityForm, duration: parseInt(e.target.value) })}
                    min="1"
                    max="480"
                    className="w-full p-3 border border-charcoal/20 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => {
                    setShowActivityModal(false);
                    setActivityForm({
                      youthCode: '',
                      activity: '',
                      trainingDate: new Date().toISOString().split('T')[0],
                      duration: 60
                    });
                  }}
                  variant="ghost"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleLogActivity}
                  variant="primary"
                  className="flex-1"
                >
                  Log Activity
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}