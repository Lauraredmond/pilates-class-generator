import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardTitle } from '../../components/ui/Card';
import { ArrowLeft, Plus, Users, Calendar, ClipboardList, Link2, UserPlus } from 'lucide-react';
import { youthHubApi } from '../../services/youthHubApi';

interface Team {
  id: string;
  name: string;
  sport: 'rugby' | 'soccer' | 'gaa';
  level?: string;
  playerCount: number;
  sessionCount: number;
}

interface LinkedPlayer {
  id: string;
  name: string;
  code: string;
  sessionsAttended: number;
}

interface RecentSession {
  id: string;
  trainingDate: string;
  templateName?: string;
  teamName: string;
  sport: string;
  attendeeCount: number;
  totalDuration: number;
}

export function CoachDashboard() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [recentSessions, setRecentSessions] = useState<RecentSession[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [roster, setRoster] = useState<LinkedPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showLinkPlayerModal, setShowLinkPlayerModal] = useState(false);
  const [showSessionModal, setShowSessionModal] = useState(false);

  // Form states
  const [teamForm, setTeamForm] = useState({
    name: '',
    sport: 'rugby' as 'rugby' | 'soccer' | 'gaa',
    level: ''
  });

  const [linkCode, setLinkCode] = useState('');
  const [linkError, setLinkError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load teams
      const teamsData = await youthHubApi.getTeams();
      setTeams(teamsData);

      // Load recent sessions
      const sessionsData = await youthHubApi.getRecentSessions(5);
      setRecentSessions(sessionsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamDetails = async (team: Team) => {
    try {
      const details = await youthHubApi.getTeam(team.id);
      setRoster(details.roster || []);
      setSelectedTeam(team);
    } catch (error) {
      console.error('Failed to load team details:', error);
    }
  };

  const handleCreateTeam = async () => {
    const { name, sport, level } = teamForm;
    if (!name || !sport) {
      alert('Please provide team name and sport');
      return;
    }

    try {
      const team = await youthHubApi.createTeam({ name, sport, level });
      setTeams([team, ...teams]);
      setTeamForm({ name: '', sport: 'rugby', level: '' });
      setShowCreateTeamModal(false);
    } catch (error) {
      console.error('Failed to create team:', error);
      alert('Failed to create team. Please try again.');
    }
  };

  const handleLinkPlayer = async () => {
    if (!selectedTeam) return;
    if (!linkCode || linkCode.length !== 6) {
      setLinkError('Please enter a valid 6-character code');
      return;
    }

    try {
      const result = await youthHubApi.linkYouthToTeam(selectedTeam.id, linkCode.toUpperCase());
      alert(`${result.youth.name} successfully linked to ${selectedTeam.name}!`);
      setLinkCode('');
      setLinkError('');
      setShowLinkPlayerModal(false);
      // Reload team details
      loadTeamDetails(selectedTeam);
    } catch (error: any) {
      setLinkError(error.message || 'Invalid code or player already linked');
    }
  };

  const startSession = (team: Team) => {
    navigate(`/youth-hub/session/new?teamId=${team.id}&sport=${team.sport}`);
  };

  const viewTeamSessions = (team: Team) => {
    navigate(`/youth-hub/team/${team.id}/sessions`);
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
          <h1 className="text-2xl font-bold text-cream">Coach Dashboard</h1>
          <div className="w-24"></div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Card>
            <CardBody>
              <button
                onClick={() => setShowCreateTeamModal(true)}
                className="w-full flex items-center justify-center gap-3 p-4 bg-burgundy text-cream rounded-lg hover:bg-burgundy/90 transition-colors"
              >
                <Plus size={20} />
                <span className="font-semibold">Create New Team</span>
              </button>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <button
                onClick={() => selectedTeam && startSession(selectedTeam)}
                className="w-full flex items-center justify-center gap-3 p-4 bg-burgundy text-cream rounded-lg hover:bg-burgundy/90 transition-colors"
                disabled={!selectedTeam}
              >
                <ClipboardList size={20} />
                <span className="font-semibold">
                  {selectedTeam ? `Log Session for ${selectedTeam.name}` : 'Select a Team First'}
                </span>
              </button>
            </CardBody>
          </Card>
        </div>

        {/* Teams Grid */}
        <Card className="mb-6">
          <CardBody>
            <CardTitle className="mb-4">Your Teams</CardTitle>
            {loading ? (
              <p className="text-charcoal/60">Loading...</p>
            ) : teams.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-16 h-16 text-charcoal/30 mx-auto mb-4" />
                <p className="text-charcoal/60 mb-4">No teams created yet</p>
                <Button onClick={() => setShowCreateTeamModal(true)} variant="primary">
                  Create Your First Team
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className={`bg-white rounded-lg p-4 border-2 cursor-pointer transition-all ${
                      selectedTeam?.id === team.id
                        ? 'border-burgundy shadow-lg'
                        : 'border-charcoal/10 hover:border-burgundy/50'
                    }`}
                    onClick={() => loadTeamDetails(team)}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold text-burgundy">{team.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs bg-burgundy/10 text-burgundy px-2 py-1 rounded">
                            {team.sport.toUpperCase()}
                          </span>
                          {team.level && (
                            <span className="text-xs bg-gray-100 text-charcoal/60 px-2 py-1 rounded">
                              {team.level}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                      <div className="text-center">
                        <div className="font-semibold text-burgundy">{team.playerCount}</div>
                        <div className="text-charcoal/60">Players</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold text-burgundy">{team.sessionCount}</div>
                        <div className="text-charcoal/60">Sessions</div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          startSession(team);
                        }}
                        variant="ghost"
                        className="flex-1 text-xs"
                      >
                        <Plus size={14} className="mr-1" />
                        Session
                      </Button>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewTeamSessions(team);
                        }}
                        variant="ghost"
                        className="flex-1 text-xs"
                      >
                        <Calendar size={14} className="mr-1" />
                        History
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Selected Team Roster */}
        {selectedTeam && (
          <Card className="mb-6">
            <CardBody>
              <div className="flex justify-between items-center mb-4">
                <CardTitle>{selectedTeam.name} Roster</CardTitle>
                <Button
                  onClick={() => setShowLinkPlayerModal(true)}
                  variant="ghost"
                  size="sm"
                >
                  <UserPlus size={16} className="mr-2" />
                  Add Player
                </Button>
              </div>

              {roster.length === 0 ? (
                <div className="text-center py-6">
                  <Link2 className="w-12 h-12 text-charcoal/30 mx-auto mb-3" />
                  <p className="text-charcoal/60 mb-3">No players linked yet</p>
                  <p className="text-sm text-charcoal/50 mb-4">
                    Ask parents for their child's 6-character code to add them to the team
                  </p>
                  <Button onClick={() => setShowLinkPlayerModal(true)} variant="primary" size="sm">
                    Link First Player
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {roster.map((player) => (
                    <div key={player.id} className="bg-gray-50 rounded-lg p-3">
                      <div className="font-semibold text-burgundy text-sm">{player.name}</div>
                      <div className="text-xs text-charcoal/60 mt-1">
                        Code: <span className="font-mono">{player.code}</span>
                      </div>
                      <div className="text-xs text-charcoal/50 mt-1">
                        {player.sessionsAttended} sessions
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        )}

        {/* Recent Sessions */}
        <Card>
          <CardBody>
            <CardTitle className="mb-4">Recent Sessions</CardTitle>
            {recentSessions.length === 0 ? (
              <p className="text-charcoal/60 text-center py-4">No sessions logged yet</p>
            ) : (
              <div className="space-y-2">
                {recentSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-burgundy">{session.teamName}</span>
                        <span className="text-charcoal/60">•</span>
                        <span className="text-xs bg-burgundy/10 text-burgundy px-2 py-1 rounded">
                          {session.sport}
                        </span>
                        {session.templateName && (
                          <>
                            <span className="text-charcoal/60">•</span>
                            <span className="text-charcoal text-sm">{session.templateName}</span>
                          </>
                        )}
                      </div>
                      <div className="text-sm text-charcoal/60 mt-1">
                        {new Date(session.trainingDate).toLocaleDateString()} •
                        {session.attendeeCount} players • {session.totalDuration} mins
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Create Team Modal */}
        {showCreateTeamModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-burgundy mb-4">Create New Team</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Team Name</label>
                  <input
                    type="text"
                    value={teamForm.name}
                    onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                    placeholder="e.g., U16 Boys"
                    className="w-full p-3 border border-charcoal/20 rounded-lg"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Sport</label>
                  <select
                    value={teamForm.sport}
                    onChange={(e) => setTeamForm({ ...teamForm, sport: e.target.value as 'rugby' | 'soccer' | 'gaa' })}
                    className="w-full p-3 border border-charcoal/20 rounded-lg"
                  >
                    <option value="rugby">Rugby</option>
                    <option value="soccer">Soccer</option>
                    <option value="gaa">GAA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-charcoal mb-1">Level (optional)</label>
                  <input
                    type="text"
                    value={teamForm.level}
                    onChange={(e) => setTeamForm({ ...teamForm, level: e.target.value })}
                    placeholder="e.g., Division 2, U16"
                    className="w-full p-3 border border-charcoal/20 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => {
                    setShowCreateTeamModal(false);
                    setTeamForm({ name: '', sport: 'rugby', level: '' });
                  }}
                  variant="ghost"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateTeam}
                  variant="primary"
                  className="flex-1"
                >
                  Create Team
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Link Player Modal */}
        {showLinkPlayerModal && selectedTeam && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-burgundy mb-4">Add Player to {selectedTeam.name}</h2>

              <p className="text-sm text-charcoal/70 mb-4">
                Enter the 6-character code provided by the player's parent
              </p>

              <input
                type="text"
                value={linkCode}
                onChange={(e) => {
                  setLinkCode(e.target.value.toUpperCase());
                  setLinkError('');
                }}
                placeholder="Enter 6-character code"
                maxLength={6}
                className="w-full p-3 border border-charcoal/20 rounded-lg font-mono text-center text-xl mb-2"
                autoFocus
              />

              {linkError && (
                <p className="text-red-600 text-sm text-center mb-4">{linkError}</p>
              )}

              <div className="flex gap-3 mt-6">
                <Button
                  onClick={() => {
                    setShowLinkPlayerModal(false);
                    setLinkCode('');
                    setLinkError('');
                  }}
                  variant="ghost"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleLinkPlayer}
                  variant="primary"
                  className="flex-1"
                  disabled={linkCode.length !== 6}
                >
                  Link Player
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}