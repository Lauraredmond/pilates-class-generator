/**
 * Analytics Dashboard - Real Data from Supabase
 * Displays user progress, movement history, and muscle group trends
 */

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { analyticsApi } from '../services/api';
import { getTempUserId } from '../utils/tempUserId';

export function Analytics() {
  const userId = getTempUserId();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real data from API
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalPracticeTime: 0,
    currentStreak: 0,
    favoriteMovement: 'The Hundred',
    classesThisWeek: 0,
    avgClassDuration: 0,
  });

  const [movementHistory, setMovementHistory] = useState<any[]>([]);
  const [muscleGroupHistory, setMuscleGroupHistory] = useState<any[]>([]);

  // Fetch analytics data on mount
  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [summaryResponse, movementHistoryResponse, muscleHistoryResponse] =
          await Promise.all([
            analyticsApi.getSummary(userId),
            analyticsApi.getMovementHistory(userId, 5),
            analyticsApi.getMuscleGroupHistory(userId, 5),
          ]);

        setStats({
          totalClasses: summaryResponse.data.total_classes,
          totalPracticeTime: summaryResponse.data.total_practice_time,
          currentStreak: summaryResponse.data.current_streak,
          favoriteMovement: summaryResponse.data.favorite_movement,
          classesThisWeek: summaryResponse.data.classes_this_week,
          avgClassDuration: summaryResponse.data.avg_class_duration,
        });

        setMovementHistory(movementHistoryResponse.data);
        setMuscleGroupHistory(muscleHistoryResponse.data);
      } catch (err: any) {
        console.error('Failed to fetch analytics:', err);
        setError(err.response?.data?.detail || 'Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [userId]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-cream/60">Loading analytics...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-cream/60">{error}</div>
        <div className="text-cream/40 text-sm">
          Generate some classes to see your analytics!
        </div>
      </div>
    );
  }

  const handleExportCSV = () => {
    // Export stats as CSV
    const csvData = `Metric,Value
Total Classes,${stats.totalClasses}
Total Practice Time (min),${stats.totalPracticeTime}
Current Streak (days),${stats.currentStreak}
Favorite Movement,${stats.favoriteMovement}
Classes This Week,${stats.classesThisWeek}
Avg Class Duration (min),${stats.avgClassDuration}`;

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pilates-analytics.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-cream mb-2">Analytics & Progress</h1>
          <p className="text-cream/70">
            Track your teaching progress and gain insights into your class patterns
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-burgundy text-cream rounded-lg hover:bg-burgundy-dark transition-colors font-semibold"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Classes */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cream/60 text-sm font-medium">Total Classes</p>
                <p className="text-4xl font-bold text-cream mt-2">{stats.totalClasses}</p>
              </div>
              <div className="h-16 w-16 rounded-full bg-burgundy/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-cream/50 text-xs mt-3">+{stats.classesThisWeek} this week</p>
          </CardBody>
        </Card>

        {/* Practice Time */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cream/60 text-sm font-medium">Practice Time</p>
                <p className="text-4xl font-bold text-cream mt-2">
                  {Math.floor(stats.totalPracticeTime / 60)}h {stats.totalPracticeTime % 60}m
                </p>
              </div>
              <div className="h-16 w-16 rounded-full bg-burgundy/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-cream/50 text-xs mt-3">~{stats.avgClassDuration} min avg</p>
          </CardBody>
        </Card>

        {/* Current Streak */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cream/60 text-sm font-medium">Current Streak</p>
                <p className="text-4xl font-bold text-cream mt-2">{stats.currentStreak} days</p>
              </div>
              <div className="h-16 w-16 rounded-full bg-burgundy/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
              </div>
            </div>
            <p className="text-cream/50 text-xs mt-3">Keep it up!</p>
          </CardBody>
        </Card>

        {/* Favorite Movement */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cream/60 text-sm font-medium">Favorite Movement</p>
                <p className="text-xl font-bold text-cream mt-2">{stats.favoriteMovement}</p>
              </div>
              <div className="h-16 w-16 rounded-full bg-burgundy/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
            <p className="text-cream/50 text-xs mt-3">Most used</p>
          </CardBody>
        </Card>
      </div>

      {/* Movement History Table */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Movement History (Week by Week)</CardTitle>
        </CardHeader>
        <CardBody className="p-6">
          {movementHistory.length === 0 ? (
            <div className="text-center text-cream/60 py-8">
              No movement history yet. Generate some classes to see your usage patterns!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-cream/30">
                    <th className="text-left py-3 px-4 text-cream font-semibold">Movement</th>
                    <th className="text-center py-3 px-4 text-cream font-semibold">Week 1</th>
                    <th className="text-center py-3 px-4 text-cream font-semibold">Week 2</th>
                    <th className="text-center py-3 px-4 text-cream font-semibold">Week 3</th>
                    <th className="text-center py-3 px-4 text-cream font-semibold">Week 4</th>
                    <th className="text-center py-3 px-4 text-cream font-semibold">Week 5</th>
                    <th className="text-center py-3 px-4 text-cream font-semibold bg-burgundy/30">Grand Total</th>
                  </tr>
                </thead>
                <tbody>
                  {movementHistory.map((row, index) => (
                    <tr
                      key={row.movement}
                      className={`border-b border-cream/10 hover:bg-burgundy/10 transition-colors ${
                        index % 2 === 0 ? 'bg-burgundy/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-cream">{row.movement}</td>
                      <td className="py-3 px-4 text-center text-cream/80">{row.week1 || '-'}</td>
                      <td className="py-3 px-4 text-center text-cream/80">{row.week2 || '-'}</td>
                      <td className="py-3 px-4 text-center text-cream/80">{row.week3 || '-'}</td>
                      <td className="py-3 px-4 text-center text-cream/80">{row.week4 || '-'}</td>
                      <td className="py-3 px-4 text-center text-cream/80">{row.week5 || '-'}</td>
                      <td className="py-3 px-4 text-center text-cream font-semibold bg-burgundy/20">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Muscle Group History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Muscle Group History (Week by Week)</CardTitle>
        </CardHeader>
        <CardBody className="p-6">
          {muscleGroupHistory.length === 0 ? (
            <div className="text-center text-cream/60 py-8">
              No muscle group history yet. Generate some classes to see your muscle group distribution!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-cream/30">
                    <th className="text-left py-3 px-4 text-cream font-semibold">Muscle Group / Goal</th>
                    <th className="text-center py-3 px-4 text-cream font-semibold">Week 1</th>
                    <th className="text-center py-3 px-4 text-cream font-semibold">Week 2</th>
                    <th className="text-center py-3 px-4 text-cream font-semibold">Week 3</th>
                    <th className="text-center py-3 px-4 text-cream font-semibold">Week 4</th>
                    <th className="text-center py-3 px-4 text-cream font-semibold">Week 5</th>
                    <th className="text-center py-3 px-4 text-cream font-semibold bg-burgundy/30">Grand Total</th>
                  </tr>
                </thead>
                <tbody>
                  {muscleGroupHistory.map((row, index) => (
                    <tr
                      key={row.group}
                      className={`border-b border-cream/10 hover:bg-burgundy/10 transition-colors ${
                        index % 2 === 0 ? 'bg-burgundy/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-cream">{row.group}</td>
                      <td className="py-3 px-4 text-center text-cream/80">{row.week1 || '-'}</td>
                      <td className="py-3 px-4 text-center text-cream/80">{row.week2 || '-'}</td>
                      <td className="py-3 px-4 text-center text-cream/80">{row.week3 || '-'}</td>
                      <td className="py-3 px-4 text-center text-cream/80">{row.week4 || '-'}</td>
                      <td className="py-3 px-4 text-center text-cream/80">{row.week5 || '-'}</td>
                      <td className="py-3 px-4 text-center text-cream font-semibold bg-burgundy/20">{row.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
