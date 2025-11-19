/**
 * Analytics Dashboard - Comprehensive Data Views with Charts
 * Features time period filtering, dynamic tables, and Chart.js visualizations
 */

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { analyticsApi } from '../services/api';
import { getTempUserId } from '../utils/tempUserId';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Doughnut, Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

type TimePeriod = 'day' | 'week' | 'month' | 'total';

interface TimeSeriesData {
  label: string;
  periods: number[];
  period_labels: string[];
  total: number;
}

export function Analytics() {
  const userId = getTempUserId();
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('week');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Summary stats
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalPracticeTime: 0,
    currentStreak: 0,
    favoriteMovement: 'The Hundred',
    classesThisWeek: 0,
    avgClassDuration: 0,
  });

  // Table data
  const [movementHistory, setMovementHistory] = useState<TimeSeriesData[]>([]);
  const [muscleGroupHistory, setMuscleGroupHistory] = useState<TimeSeriesData[]>([]);

  // Chart data
  const [practiceFrequency, setPracticeFrequency] = useState<any>(null);
  const [difficultyProgression, setDifficultyProgression] = useState<any>(null);
  const [muscleDistribution, setMuscleDistribution] = useState<any>(null);

  // Fetch all analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const [
          summaryResponse,
          movementHistoryResponse,
          muscleHistoryResponse,
          practiceFreqResponse,
          difficultyProgResponse,
          muscleDistResponse,
        ] = await Promise.all([
          analyticsApi.getSummary(userId),
          analyticsApi.getMovementHistory(userId, timePeriod),
          analyticsApi.getMuscleGroupHistory(userId, timePeriod),
          analyticsApi.getPracticeFrequency(userId, timePeriod),
          analyticsApi.getDifficultyProgression(userId, timePeriod),
          analyticsApi.getMuscleDistribution(userId, 'total'), // Always show total for doughnut
        ]);

        // Update stats
        setStats({
          totalClasses: summaryResponse.data.total_classes,
          totalPracticeTime: summaryResponse.data.total_practice_time,
          currentStreak: summaryResponse.data.current_streak,
          favoriteMovement: summaryResponse.data.favorite_movement,
          classesThisWeek: summaryResponse.data.classes_this_week,
          avgClassDuration: summaryResponse.data.avg_class_duration,
        });

        // Update tables
        setMovementHistory(movementHistoryResponse.data);
        setMuscleGroupHistory(muscleHistoryResponse.data);

        // Update charts
        setPracticeFrequency(practiceFreqResponse.data);
        setDifficultyProgression(difficultyProgResponse.data);
        setMuscleDistribution(muscleDistResponse.data);
      } catch (err: any) {
        console.error('Failed to fetch analytics:', err);
        setError(err.response?.data?.detail || 'Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, [userId, timePeriod]);

  // Chart configurations
  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#f5f1e8' },
        grid: { color: 'rgba(245, 241, 232, 0.1)' },
      },
      x: {
        ticks: { color: '#f5f1e8' },
        grid: { color: 'rgba(245, 241, 232, 0.1)' },
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { color: '#f5f1e8' } },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#f5f1e8' },
        grid: { color: 'rgba(245, 241, 232, 0.1)' },
      },
      x: {
        ticks: { color: '#f5f1e8' },
        grid: { color: 'rgba(245, 241, 232, 0.1)' },
      },
    },
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'right' as const, labels: { color: '#f5f1e8' } },
    },
  };

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

  // Prepare chart data
  const practiceFrequencyChartData = practiceFrequency
    ? {
        labels: practiceFrequency.period_labels,
        datasets: [
          {
            label: 'Classes',
            data: practiceFrequency.class_counts,
            borderColor: '#8b2635',
            backgroundColor: 'rgba(139, 38, 53, 0.5)',
            tension: 0.4,
          },
        ],
      }
    : null;

  const difficultyProgressionChartData = difficultyProgression
    ? {
        labels: difficultyProgression.period_labels,
        datasets: [
          {
            label: 'Beginner',
            data: difficultyProgression.beginner_counts,
            backgroundColor: 'rgba(139, 38, 53, 0.8)',
          },
          {
            label: 'Intermediate',
            data: difficultyProgression.intermediate_counts,
            backgroundColor: 'rgba(139, 38, 53, 0.6)',
          },
          {
            label: 'Advanced',
            data: difficultyProgression.advanced_counts,
            backgroundColor: 'rgba(139, 38, 53, 0.4)',
          },
        ],
      }
    : null;

  const muscleDistributionChartData = muscleDistribution
    ? {
        labels: muscleDistribution.muscle_groups,
        datasets: [
          {
            data: muscleDistribution.percentages,
            backgroundColor: [
              '#8b2635',
              '#a12d3f',
              '#b73449',
              '#cd3b53',
              '#e3425d',
              '#8b4635',
              '#a1523f',
              '#b75e49',
              '#cd6a53',
              '#e3765d',
            ],
          },
        ],
      }
    : null;

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

      {/* Time Period Filter */}
      <div className="mb-6">
        <div className="inline-flex rounded-lg border border-cream/30 bg-burgundy-dark p-1">
          {(['day', 'week', 'month', 'total'] as TimePeriod[]).map((period) => (
            <button
              key={period}
              onClick={() => setTimePeriod(period)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                timePeriod === period
                  ? 'bg-burgundy text-cream'
                  : 'text-cream/60 hover:text-cream'
              }`}
            >
              {period === 'day' && 'By Day'}
              {period === 'week' && 'By Week'}
              {period === 'month' && 'By Month'}
              {period === 'total' && 'Totals'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Practice Frequency Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Practice Frequency</CardTitle>
          </CardHeader>
          <CardBody className="p-6">
            <div className="h-64">
              {practiceFrequencyChartData ? (
                <Line data={practiceFrequencyChartData} options={lineChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-cream/60">
                  No data available
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Difficulty Progression Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Difficulty Progression</CardTitle>
          </CardHeader>
          <CardBody className="p-6">
            <div className="h-64">
              {difficultyProgressionChartData ? (
                <Bar data={difficultyProgressionChartData} options={barChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-cream/60">
                  No data available
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Muscle Distribution Chart (Full Width) */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Muscle Group Distribution</CardTitle>
        </CardHeader>
        <CardBody className="p-6">
          <div className="h-96">
            {muscleDistributionChartData ? (
              <Doughnut data={muscleDistributionChartData} options={doughnutChartOptions} />
            ) : (
              <div className="flex items-center justify-center h-full text-cream/60">
                No data available
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Movement History Table */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>
            Movement History (
            {timePeriod === 'day' && 'Daily'}
            {timePeriod === 'week' && 'Weekly'}
            {timePeriod === 'month' && 'Monthly'}
            {timePeriod === 'total' && 'All Time'}
            )
          </CardTitle>
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
                    {movementHistory[0]?.period_labels.map((label, idx) => (
                      <th key={idx} className="text-center py-3 px-4 text-cream font-semibold">
                        {label}
                      </th>
                    ))}
                    <th className="text-center py-3 px-4 text-cream font-semibold bg-burgundy/30">
                      Grand Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {movementHistory.map((row, index) => (
                    <tr
                      key={row.label}
                      className={`border-b border-cream/10 hover:bg-burgundy/10 transition-colors ${
                        index % 2 === 0 ? 'bg-burgundy/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-cream">{row.label}</td>
                      {row.periods.map((count, idx) => (
                        <td key={idx} className="py-3 px-4 text-center text-cream/80">
                          {count || '-'}
                        </td>
                      ))}
                      <td className="py-3 px-4 text-center text-cream font-semibold bg-burgundy/20">
                        {row.total}
                      </td>
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
          <CardTitle>
            Muscle Group History (
            {timePeriod === 'day' && 'Daily'}
            {timePeriod === 'week' && 'Weekly'}
            {timePeriod === 'month' && 'Monthly'}
            {timePeriod === 'total' && 'All Time'}
            )
          </CardTitle>
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
                    <th className="text-left py-3 px-4 text-cream font-semibold">
                      Muscle Group / Goal
                    </th>
                    {muscleGroupHistory[0]?.period_labels.map((label, idx) => (
                      <th key={idx} className="text-center py-3 px-4 text-cream font-semibold">
                        {label}
                      </th>
                    ))}
                    <th className="text-center py-3 px-4 text-cream font-semibold bg-burgundy/30">
                      Grand Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {muscleGroupHistory.map((row, index) => (
                    <tr
                      key={row.label}
                      className={`border-b border-cream/10 hover:bg-burgundy/10 transition-colors ${
                        index % 2 === 0 ? 'bg-burgundy/5' : ''
                      }`}
                    >
                      <td className="py-3 px-4 text-cream">{row.label}</td>
                      {row.periods.map((count, idx) => (
                        <td key={idx} className="py-3 px-4 text-center text-cream/80">
                          {count || '-'}
                        </td>
                      ))}
                      <td className="py-3 px-4 text-center text-cream font-semibold bg-burgundy/20">
                        {row.total}
                      </td>
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
