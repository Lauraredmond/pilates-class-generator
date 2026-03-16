import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { ArrowLeft, ChevronLeft, ChevronRight, Clock, Users, Activity } from 'lucide-react';
import { youthHubApi } from '../../services/youthHubApi';

interface Youth {
  id: string;
  name: string;
  code: string;
}

interface TimelineEvent {
  id: string;
  source: 'coach' | 'parent';
  trainingDate: string;
  sport: string;
  label: string;
  detail?: string;
  durationMins: number;
  drills?: any[];
}

interface DayEvents {
  date: string;
  dayName: string;
  events: TimelineEvent[];
  eventCount: number;
  totalMins: number;
  isToday: boolean;
}

interface WeekStats {
  totalSessions: number;
  totalMinutes: number;
  totalHours: number;
  sports: string[];
  weekStart: string;
  weekEnd: string;
  weekOffset: number;
}

// Sport color mapping
const SPORT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  rugby: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  soccer: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  gaa: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  swimming: { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-300' },
  dance: { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-300' },
  'martial arts': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
  default: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' }
};

function getSportColors(sport: string) {
  const key = sport.toLowerCase();
  return SPORT_COLORS[key] || SPORT_COLORS.default;
}

export function TimelineView() {
  const { youthCode } = useParams<{ youthCode: string }>();
  const navigate = useNavigate();
  const [youth, setYouth] = useState<Youth | null>(null);
  const [days, setDays] = useState<DayEvents[]>([]);
  const [weekStats, setWeekStats] = useState<WeekStats | null>(null);
  const [allTimeStats, setAllTimeStats] = useState<any>(null);
  const [weekOffset, setWeekOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<DayEvents | null>(null);

  useEffect(() => {
    if (youthCode) {
      loadTimeline();
    }
  }, [youthCode, weekOffset]);

  const loadTimeline = async () => {
    if (!youthCode) return;

    try {
      setLoading(true);
      // Load youth details
      const youthData = await youthHubApi.getYouth(youthCode);
      setYouth(youthData.youth);

      // Load week timeline
      const weekData = await youthHubApi.getYouthWeekTimeline(youthCode, weekOffset);
      setDays(weekData.days || []);
      setWeekStats(weekData.weekStats);

      // Load all-time stats
      if (weekOffset === 0) {
        const stats = await youthHubApi.getYouthStats(youthCode);
        setAllTimeStats(stats.allTimeStats);
      }
    } catch (error) {
      console.error('Failed to load timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeWeek = (direction: number) => {
    setWeekOffset(weekOffset + direction);
    setSelectedDay(null);
  };

  const goToToday = () => {
    setWeekOffset(0);
    setSelectedDay(null);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-burgundy flex items-center justify-center">
        <div className="text-cream">Loading timeline...</div>
      </div>
    );
  }

  if (!youth) {
    return (
      <div className="min-h-screen bg-burgundy flex items-center justify-center">
        <div className="text-center">
          <p className="text-cream mb-4">Youth not found</p>
          <Button onClick={() => navigate('/youth-hub/parent')} variant="secondary">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-burgundy">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-cream/70 hover:text-cream transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-cream">{youth.name}'s Timeline</h1>
            <p className="text-cream/60 text-sm">Code: {youth.code}</p>
          </div>
          <div className="w-20"></div>
        </div>

        {/* Week Navigation */}
        <Card className="mb-6">
          <CardBody>
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => changeWeek(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="text-center">
                <h2 className="font-semibold text-burgundy">
                  {weekStats && new Date(weekStats.weekStart).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                  })} - {weekStats && new Date(weekStats.weekEnd).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </h2>
                {weekOffset !== 0 && (
                  <button
                    onClick={goToToday}
                    className="text-sm text-burgundy/60 hover:text-burgundy mt-1"
                  >
                    Go to current week
                  </button>
                )}
              </div>

              <button
                onClick={() => changeWeek(1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Week Summary */}
            {weekStats && weekStats.totalSessions > 0 && (
              <div className="grid grid-cols-3 gap-4 p-4 bg-burgundy/5 rounded-lg mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-burgundy">{weekStats.totalSessions}</div>
                  <div className="text-sm text-charcoal/60">Sessions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-burgundy">{weekStats.totalHours}</div>
                  <div className="text-sm text-charcoal/60">Hours</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-burgundy">{weekStats.sports.length}</div>
                  <div className="text-sm text-charcoal/60">Sports</div>
                </div>
              </div>
            )}

            {/* Weekly Grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => {
                const hasEvents = day.eventCount > 0;
                const isSelected = selectedDay?.date === day.date;

                return (
                  <div key={day.date} className="flex flex-col">
                    <div className="text-center text-xs text-charcoal/60 mb-1">
                      {day.dayName}
                    </div>
                    <button
                      onClick={() => setSelectedDay(hasEvents ? day : null)}
                      className={`
                        relative min-h-[80px] p-2 rounded-lg transition-all
                        ${day.isToday ? 'ring-2 ring-burgundy' : ''}
                        ${isSelected ? 'bg-burgundy/10 shadow-lg' : 'bg-white'}
                        ${hasEvents ? 'hover:shadow-md cursor-pointer' : 'cursor-default'}
                        ${!hasEvents ? 'opacity-50' : ''}
                      `}
                    >
                      <div className="text-xs text-charcoal/60 mb-1">
                        {new Date(day.date).getDate()}
                      </div>

                      {hasEvents && (
                        <>
                          <div className="space-y-1">
                            {day.events.slice(0, 2).map((event, idx) => {
                              const colors = getSportColors(event.sport);
                              return (
                                <div
                                  key={idx}
                                  className={`
                                    text-xs px-1 py-0.5 rounded
                                    ${colors.bg} ${colors.text}
                                  `}
                                  title={event.label}
                                >
                                  {event.sport.substring(0, 3).toUpperCase()}
                                </div>
                              );
                            })}
                            {day.events.length > 2 && (
                              <div className="text-xs text-charcoal/60">
                                +{day.events.length - 2} more
                              </div>
                            )}
                          </div>

                          <div className="absolute bottom-1 right-1 text-xs text-charcoal/40">
                            {Math.round(day.totalMins / 60)}h
                          </div>
                        </>
                      )}

                      {day.isToday && (
                        <div className="absolute top-1 right-1 w-2 h-2 bg-burgundy rounded-full"></div>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Selected Day Details */}
            {selectedDay && selectedDay.events.length > 0 && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-burgundy mb-3">
                  {new Date(selectedDay.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                </h3>

                <div className="space-y-3">
                  {selectedDay.events.map((event) => {
                    const colors = getSportColors(event.sport);
                    return (
                      <div key={event.id} className={`p-3 bg-white rounded-lg border ${colors.border}`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {event.source === 'coach' ? (
                                <Users size={14} className={colors.text} />
                              ) : (
                                <Activity size={14} className={colors.text} />
                              )}
                              <span className={`text-sm font-semibold ${colors.text}`}>
                                {event.sport}
                              </span>
                              <span className="text-charcoal/60">•</span>
                              <span className="text-sm text-charcoal">
                                {event.label}
                              </span>
                            </div>

                            {event.detail && (
                              <p className="text-sm text-charcoal/70 ml-6">
                                {event.detail}
                              </p>
                            )}

                            <div className="flex items-center gap-3 mt-2 ml-6 text-xs text-charcoal/60">
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {formatTime(event.trainingDate)}
                              </span>
                              <span>{event.durationMins} mins</span>
                              {event.drills && event.drills.length > 0 && (
                                <span>{event.drills.length} drills</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        {/* All-Time Statistics */}
        {allTimeStats && weekOffset === 0 && (
          <Card>
            <CardBody>
              <h3 className="font-semibold text-burgundy mb-4">All-Time Statistics</h3>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-burgundy/5 rounded-lg">
                  <div className="text-2xl font-bold text-burgundy">{allTimeStats.totalSessions}</div>
                  <div className="text-sm text-charcoal/60">Total Sessions</div>
                </div>
                <div className="text-center p-3 bg-burgundy/5 rounded-lg">
                  <div className="text-2xl font-bold text-burgundy">{allTimeStats.totalHours}</div>
                  <div className="text-sm text-charcoal/60">Total Hours</div>
                </div>
                <div className="text-center p-3 bg-burgundy/5 rounded-lg">
                  <div className="text-2xl font-bold text-burgundy">{allTimeStats.sportCount}</div>
                  <div className="text-sm text-charcoal/60">Different Sports</div>
                </div>
              </div>

              {allTimeStats.sportBreakdown && allTimeStats.sportBreakdown.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-charcoal/70 mb-2">Sport Breakdown</h4>
                  <div className="space-y-2">
                    {allTimeStats.sportBreakdown.map((sport: any) => {
                      const colors = getSportColors(sport.sport);
                      const percentage = Math.round((sport.totalMins / allTimeStats.totalMinutes) * 100);

                      return (
                        <div key={sport.sport} className="flex items-center gap-3">
                          <div className={`px-2 py-1 rounded text-xs ${colors.bg} ${colors.text}`}>
                            {sport.sport}
                          </div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-burgundy transition-all"
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="text-sm text-charcoal/60">
                            {sport.sessionCount} sessions • {sport.totalHours}h
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}