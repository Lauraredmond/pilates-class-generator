/**
 * Analytics Dashboard - Comprehensive Data Views with Charts
 * Features time period filtering, dynamic tables, and Chart.js visualizations
 */

import { useState, useEffect } from 'react';
import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { analyticsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Doughnut, Chart } from 'react-chartjs-2';
import { logger } from '../utils/logger';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
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
  const { user } = useAuth();
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
  const [movementFamilyDistribution, setMovementFamilyDistribution] = useState<any>(null); // SESSION: Movement Families
  const [musicGenreDistribution, setMusicGenreDistribution] = useState<any>(null); // Music genre stacked bar chart
  const [classDurationDistribution, setClassDurationDistribution] = useState<any>(null); // Class duration stacked bar chart

  // Fetch all analytics data
  const fetchAnalytics = async () => {
    if (!user) {
      setIsLoading(false);
      setError('You must be logged in to view analytics');
      return;
    }

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
        familyDistResponse, // SESSION: Movement Families
        musicGenreDistResponse, // Music genre distribution
        durationDistResponse, // Class duration distribution
      ] = await Promise.all([
        analyticsApi.getSummary(user.id),
        analyticsApi.getMovementHistory(user.id, timePeriod),
        analyticsApi.getMuscleGroupHistory(user.id, timePeriod),
        analyticsApi.getPracticeFrequency(user.id, timePeriod),
        analyticsApi.getDifficultyProgression(user.id, timePeriod),
        analyticsApi.getMuscleDistribution(user.id, 'total'), // Always show total for doughnut
        analyticsApi.getMovementFamilyDistribution(user.id, 'total'), // SESSION: Movement Families
        analyticsApi.getMusicGenreDistribution(user.id, 'total'), // Music genre ranked bar (always total)
        analyticsApi.getClassDurationDistribution(user.id, timePeriod), // Duration stacked bar
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
      setMovementFamilyDistribution(familyDistResponse.data); // SESSION: Movement Families
      setMusicGenreDistribution(musicGenreDistResponse.data); // Music genre stacked bar
      setClassDurationDistribution(durationDistResponse.data); // Class duration stacked bar
    } catch (err: any) {
      logger.error('Failed to fetch analytics:', err);
      setError(err.response?.data?.detail || 'Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user, timePeriod]);

  // Auto-refresh when user navigates back to this page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Page became visible again - refresh data
        fetchAnalytics();
      }
    };

    const handleFocus = () => {
      // Window regained focus - refresh data
      fetchAnalytics();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, timePeriod]);

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
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            if (label === 'Challenging movement as % of total movements performed') {
              return `${label}: ${value}%`;
            }
            return `${label}: ${value}`;
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear' as const,
        position: 'left' as const,
        beginAtZero: true,
        ticks: {
          color: '#f5f1e8',
          callback: function(value: any) {
            return value;
          }
        },
        grid: { color: 'rgba(245, 241, 232, 0.1)' },
        title: {
          display: true,
          text: 'Movement Count',
          color: '#f5f1e8',
          font: { size: 12 }
        }
      },
      y1: {
        type: 'linear' as const,
        position: 'right' as const,
        beginAtZero: true,
        max: 100,
        ticks: {
          color: '#D4AF37',
          callback: function(value: any) {
            return value + '%';
          }
        },
        grid: {
          drawOnChartArea: false, // Don't draw grid lines for this axis
        },
        title: {
          display: true,
          text: 'Challenging %',
          color: '#D4AF37',
          font: { size: 12 }
        }
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

  const stackedBarChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' as const, labels: { color: '#f5f1e8' } },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        stacked: true,
        ticks: {
          color: '#f5f1e8',
          stepSize: 1,
          callback: function(value: any) {
            // Only show integer labels on x-axis
            return Number.isInteger(value) ? value : null;
          }
        },
        grid: { color: 'rgba(245, 241, 232, 0.1)' },
      },
      y: {
        stacked: true,
        beginAtZero: true,
        ticks: {
          color: '#f5f1e8',
          stepSize: 1,
          callback: function(value: any) {
            // Only show integer labels on y-axis
            return Number.isInteger(value) ? value : null;
          }
        },
        grid: { color: 'rgba(245, 241, 232, 0.1)' },
        title: {
          display: true,
          text: 'Number of Classes',
          color: '#f5f1e8',
          font: { size: 12 }
        }
      },
    },
  };

  // Horizontal Bar Chart Options - Music Genre Favorites
  const horizontalBarChartOptions = {
    indexAxis: 'y' as const,  // Horizontal bars
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },  // No legend needed for single dataset
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return `Classes: ${context.parsed.x}`;
          }
        }
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          color: '#f5f1e8',
          stepSize: 1,
          callback: function(value: any) {
            // Only show integer labels
            return Number.isInteger(value) ? value : null;
          }
        },
        grid: { color: 'rgba(245, 241, 232, 0.1)' },
        title: {
          display: true,
          text: 'Number of Classes',
          color: '#f5f1e8',
          font: { size: 12 }
        }
      },
      y: {
        ticks: {
          color: '#f5f1e8',
          font: { size: 12 }
        },
        grid: { color: 'rgba(245, 241, 232, 0.1)' },
      },
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
            backgroundColor: '#cd8b76', // Light terracotta - warm, approachable
            yAxisID: 'y',
            type: 'bar' as const,
            order: 1, // Render behind line
          },
          {
            label: 'Intermediate',
            data: difficultyProgression.intermediate_counts,
            backgroundColor: '#8b2635', // Primary burgundy - brand color
            yAxisID: 'y',
            type: 'bar' as const,
            order: 1, // Render behind line
          },
          {
            label: 'Advanced',
            data: difficultyProgression.advanced_counts,
            backgroundColor: '#5c1a26', // Dark burgundy - intense, challenging
            yAxisID: 'y',
            type: 'bar' as const,
            order: 1, // Render behind line
          },
          {
            label: 'Challenging movement as % of total movements performed',
            data: difficultyProgression.period_labels.map((_: string, idx: number) => {
              const beginner = difficultyProgression.beginner_counts[idx] || 0;
              const intermediate = difficultyProgression.intermediate_counts[idx] || 0;
              const advanced = difficultyProgression.advanced_counts[idx] || 0;
              const total = beginner + intermediate + advanced;
              const challenging = intermediate + advanced;
              return total > 0 ? Math.round((challenging / total) * 100) : 0;
            }),
            borderColor: '#D4AF37', // Olympic gold
            backgroundColor: 'rgba(212, 175, 55, 0.2)', // Olympic gold with transparency
            borderWidth: 3,
            yAxisID: 'y1',
            type: 'line' as const,
            tension: 0.4,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#D4AF37',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            order: 0, // Render in front of bars
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
              '#8b2635',  // Primary burgundy - deep red
              '#cd8b76',  // Terracotta - warm orange
              '#f5f1e8',  // Cream - light neutral
              '#5c1a26',  // Dark burgundy - almost brown
              '#e3a57a',  // Light peach - bright accent
              '#3d1118',  // Very dark burgundy - chocolate
              '#b8927d',  // Medium beige - earthy
              '#d94d5c',  // Bright coral red - vibrant
              '#9e7762',  // Warm brown - neutral
              '#f7d9c4',  // Light cream - pale accent
              // Additional colors for 23 muscle groups
              '#6b2532',  // Medium dark burgundy
              '#dda88f',  // Peachy tan
              '#4a1820',  // Deep chocolate
              '#c67a6a',  // Dusty rose
              '#8a6f5f',  // Taupe brown
              '#f2c6a8',  // Light tan
              '#a13d48',  // Rose burgundy
              '#755c52',  // Warm gray brown
              '#e8bfa3',  // Cream tan
              '#7d2e3a',  // Deep rose
              '#b89988',  // Light brown
              '#cf9b84',  // Soft terracotta
              '#5d4840',  // Dark taupe
            ],
          },
        ],
      }
    : null;

  // SESSION: Movement Families - December 2025
  // Helper function to format family names for display (remove underscores, capitalize)
  const formatFamilyName = (family: string): string => {
    return family
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const movementFamilyDistributionChartData = movementFamilyDistribution
    ? {
        labels: movementFamilyDistribution.families.map(formatFamilyName),
        datasets: [
          {
            data: movementFamilyDistribution.percentages,
            backgroundColor: [
              '#8b2635',  // Primary burgundy (dark red) - rolling
              '#f5f1e8',  // Cream (very light) - supine_abdominal
              '#3d1118',  // Very dark burgundy (almost black) - inversion
              '#e3a57a',  // Light peach (light orange) - back_extension
              '#5c1a26',  // Dark burgundy - hip_extensor
              '#cd8b76',  // Terracotta (medium orange) - side_lying
              '#2a0d12',  // Deepest burgundy (near black) - seated_spinal_articulation
              '#d94d5c',  // Bright coral red (vibrant) - other
            ],
          },
        ],
      }
    : null;

  // Music Genre Favorites - Horizontal Ranked Bar Chart
  const musicGenreDistributionChartData = musicGenreDistribution
    ? {
        labels: musicGenreDistribution.genres,  // Already sorted by usage
        datasets: [
          {
            label: 'Classes',
            data: musicGenreDistribution.counts,
            backgroundColor: [
              '#8b2635',  // #1 Most used - Primary burgundy
              '#cd8b76',  // #2 - Terracotta
              '#5c1a26',  // #3 - Dark burgundy
              '#e3a57a',  // #4 - Light peach
              '#3d1118',  // #5 - Very dark burgundy
              '#f5f1e8',  // #6 - Cream
              '#d94d5c',  // #7 - Bright coral red
              '#b8927d',  // #8 - Medium beige
            ],
          },
        ],
      }
    : null;

  // Class Duration Distribution - Stacked Bar Chart
  const classDurationDistributionChartData = classDurationDistribution
    ? {
        labels: classDurationDistribution.period_labels,
        datasets: classDurationDistribution.durations.map((duration: number, idx: number) => ({
          label: `${duration} min`,
          data: classDurationDistribution.duration_counts[String(duration)],
          backgroundColor: [
            '#cd8b76',  // 12 min - Terracotta (lightest)
            '#b8927d',  // 30 min - Medium beige
            '#8b2635',  // 45 min - Primary burgundy
            '#5c1a26',  // 60 min - Dark burgundy
            '#3d1118',  // 75 min - Very dark burgundy
            '#2a0d12',  // 90 min - Deepest burgundy (darkest)
          ][idx % 6],
        })),
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
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-burgundy text-cream rounded-lg hover:bg-burgundy-dark transition-colors font-semibold"
        >
          Export CSV
        </button>
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
                <p className="text-cream/60 text-sm font-medium">Practise Time</p>
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
            <CardTitle>Practise Frequency</CardTitle>
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
                <Chart type="bar" data={difficultyProgressionChartData} options={barChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-cream/60">
                  No data available
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Distribution Charts Grid - Side by Side on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Muscle Distribution Chart */}
        <Card>
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

        {/* SESSION: Movement Families - December 2025 */}
        {/* Movement Family Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Movement Family Distribution</CardTitle>
          </CardHeader>
          <CardBody className="p-6">
            <div className="h-96">
              {movementFamilyDistributionChartData ? (
                <Doughnut data={movementFamilyDistributionChartData} options={doughnutChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-cream/60">
                  No data available
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Music Genre & Class Duration Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Music Genre Favorites - Ranked Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Favorite Music Genres</CardTitle>
          </CardHeader>
          <CardBody className="p-6">
            <div className="h-96">
              {musicGenreDistributionChartData ? (
                <Chart type="bar" data={musicGenreDistributionChartData} options={horizontalBarChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-cream/60">
                  No data available
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Class Duration Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Class Duration Distribution Over Time</CardTitle>
          </CardHeader>
          <CardBody className="p-6">
            <div className="h-96">
              {classDurationDistributionChartData ? (
                <Chart type="bar" data={classDurationDistributionChartData} options={stackedBarChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-cream/60">
                  No data available
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

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
            <div className="overflow-x-auto max-h-[600px] relative">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-cream/30 bg-burgundy-dark">
                    <th className="sticky left-0 z-20 text-left py-3 px-2 md:px-4 text-cream font-semibold bg-burgundy-dark border-r border-cream/20 min-w-[140px] md:min-w-[180px]">
                      Movement
                    </th>
                    {movementHistory[0]?.period_labels.map((label, idx) => (
                      <th key={idx} className="text-center py-3 px-2 md:px-4 text-cream font-semibold bg-burgundy-dark whitespace-nowrap min-w-[60px] md:min-w-[80px]">
                        {label}
                      </th>
                    ))}
                    <th className="text-center py-3 px-2 md:px-4 text-cream font-semibold bg-burgundy/30 whitespace-nowrap min-w-[60px] md:min-w-[80px]">
                      Total
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
                      <td className="sticky left-0 z-5 py-3 px-2 md:px-4 text-cream text-sm border-r border-cream/20 bg-inherit min-w-[140px] md:min-w-[180px]">
                        {row.label}
                      </td>
                      {row.periods.map((count, idx) => (
                        <td key={idx} className="py-3 px-2 md:px-4 text-center text-cream/80 min-w-[60px] md:min-w-[80px]">
                          {count || '-'}
                        </td>
                      ))}
                      <td className="py-3 px-2 md:px-4 text-center text-cream font-semibold bg-burgundy/20 min-w-[60px] md:min-w-[80px]">
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
            <div className="overflow-x-auto max-h-[600px] relative">
              <table className="w-full border-collapse">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-cream/30 bg-burgundy-dark">
                    <th className="sticky left-0 z-20 text-left py-3 px-2 md:px-4 text-cream font-semibold bg-burgundy-dark border-r border-cream/20 min-w-[140px] md:min-w-[180px]">
                      Muscle Group
                    </th>
                    {muscleGroupHistory[0]?.period_labels.map((label, idx) => (
                      <th key={idx} className="text-center py-3 px-2 md:px-4 text-cream font-semibold bg-burgundy-dark whitespace-nowrap min-w-[60px] md:min-w-[80px]">
                        {label}
                      </th>
                    ))}
                    <th className="text-center py-3 px-2 md:px-4 text-cream font-semibold bg-burgundy/30 whitespace-nowrap min-w-[60px] md:min-w-[80px]">
                      Total
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
                      <td className="sticky left-0 z-5 py-3 px-2 md:px-4 text-cream text-sm border-r border-cream/20 bg-inherit min-w-[140px] md:min-w-[180px]">
                        {row.label}
                      </td>
                      {row.periods.map((count, idx) => (
                        <td key={idx} className="py-3 px-2 md:px-4 text-center text-cream/80 min-w-[60px] md:min-w-[80px]">
                          {count || '-'}
                        </td>
                      ))}
                      <td className="py-3 px-2 md:px-4 text-center text-cream font-semibold bg-burgundy/20 min-w-[60px] md:min-w-[80px]">
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

      {/* Session 10: Admin LLM Usage Logs - Admin Only Section */}
      {user?.is_admin && (
        <AdminLLMUsageLogs userId={user.id} />
      )}
    </div>
  );
}

// ==============================================================================
// ADMIN LLM USAGE LOGS COMPONENT - Session 10: Jentic Integration
// ==============================================================================

interface AdminLLMUsageLogsProps {
  userId: string;
}

function AdminLLMUsageLogs({ userId }: AdminLLMUsageLogsProps) {
  const [llmStats, setLLMStats] = useState<any>(null);
  const [llmLogs, setLLMLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [daysBack, setDaysBack] = useState(30);
  const [methodFilter, setMethodFilter] = useState<'all' | 'ai_agent' | 'direct_api'>('all');
  const [currentPage, _setCurrentPage] = useState(1); // Pagination not yet implemented
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  useEffect(() => {
    const fetchLLMData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch stats and logs in parallel
        const [statsResponse, logsResponse] = await Promise.all([
          analyticsApi.getLLMUsageStats(userId, daysBack),
          analyticsApi.getLLMLogs({
            admin_user_id: userId,
            page: currentPage,
            page_size: 20,
            method_filter: methodFilter === 'all' ? undefined : methodFilter,
            days_back: daysBack,
          }),
        ]);

        setLLMStats(statsResponse.data);
        setLLMLogs(logsResponse.data.logs);
      } catch (err: any) {
        logger.error('Failed to fetch LLM data:', err);
        if (err.response?.status === 403) {
          setError('Admin access required to view LLM logs');
        } else {
          setError(err.response?.data?.detail || 'Failed to load LLM usage data');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchLLMData();
  }, [userId, daysBack, methodFilter, currentPage]);

  if (isLoading) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>
            <span className="bg-burgundy px-3 py-1 rounded text-sm mr-2">ADMIN</span>
            LLM Usage Logs
          </CardTitle>
        </CardHeader>
        <CardBody className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-cream/60">Loading LLM usage data...</div>
          </div>
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>
            <span className="bg-burgundy px-3 py-1 rounded text-sm mr-2">ADMIN</span>
            LLM Usage Logs
          </CardTitle>
        </CardHeader>
        <CardBody className="p-6">
          <div className="flex items-center justify-center h-32">
            <div className="text-red-400">{error}</div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Admin Badge and Header */}
      <div className="bg-burgundy/20 border-2 border-burgundy p-4 rounded-lg">
        <div className="flex items-center gap-3">
          <span className="bg-burgundy px-3 py-1 rounded text-sm font-bold">ADMIN ONLY</span>
          <h2 className="text-2xl font-bold text-cream">LLM Usage & Observability</h2>
        </div>
        <p className="text-cream/70 mt-2">
          Monitor AI agent invocations, costs, and prompts sent to the LLM
        </p>
      </div>

      {/* LLM Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>LLM Usage Statistics (Last {daysBack} Days)</CardTitle>
        </CardHeader>
        <CardBody className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-burgundy/10 p-4 rounded-lg">
              <p className="text-cream/60 text-xs font-medium mb-1">Total Invocations</p>
              <p className="text-2xl font-bold text-cream">{llmStats.total_invocations}</p>
            </div>
            <div className="bg-burgundy/10 p-4 rounded-lg">
              <p className="text-cream/60 text-xs font-medium mb-1">AI Agent Calls</p>
              <p className="text-2xl font-bold text-cream">{llmStats.ai_agent_calls}</p>
              <p className="text-cream/50 text-xs mt-1">Used LLM</p>
            </div>
            <div className="bg-burgundy/10 p-4 rounded-lg">
              <p className="text-cream/60 text-xs font-medium mb-1">Direct API Calls</p>
              <p className="text-2xl font-bold text-cream">{llmStats.direct_api_calls}</p>
              <p className="text-cream/50 text-xs mt-1">No LLM</p>
            </div>
            <div className="bg-burgundy/10 p-4 rounded-lg">
              <p className="text-cream/60 text-xs font-medium mb-1">LLM Success Rate</p>
              <p className="text-2xl font-bold text-cream">{llmStats.llm_success_rate}%</p>
            </div>
            <div className="bg-burgundy/10 p-4 rounded-lg">
              <p className="text-cream/60 text-xs font-medium mb-1">Avg Processing Time</p>
              <p className="text-2xl font-bold text-cream">
                {(llmStats.avg_processing_time_ms / 1000).toFixed(1)}s
              </p>
            </div>
            <div className="bg-burgundy/10 p-4 rounded-lg border-2 border-burgundy/50">
              <p className="text-cream/60 text-xs font-medium mb-1">Estimated Cost</p>
              <p className="text-2xl font-bold text-cream">{llmStats.total_estimated_cost}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Invocation Logs</CardTitle>
        </CardHeader>
        <CardBody className="p-6">
          <div className="flex gap-4 mb-6">
            <div>
              <label className="block text-cream/60 text-sm mb-2">Time Period</label>
              <select
                value={daysBack}
                onChange={(e) => setDaysBack(Number(e.target.value))}
                className="bg-burgundy-dark border border-cream/30 rounded-lg px-4 py-2 text-cream"
              >
                <option value={7}>Last 7 Days</option>
                <option value={30}>Last 30 Days</option>
                <option value={90}>Last 90 Days</option>
                <option value={365}>Last Year</option>
              </select>
            </div>

            <div>
              <label className="block text-cream/60 text-sm mb-2">Method Filter</label>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value as any)}
                className="bg-burgundy-dark border border-cream/30 rounded-lg px-4 py-2 text-cream"
              >
                <option value="all">All Methods</option>
                <option value="ai_agent">AI Agent Only</option>
                <option value="direct_api">Direct API Only</option>
              </select>
            </div>
          </div>

          {/* Logs Table */}
          {llmLogs.length === 0 ? (
            <div className="text-center text-cream/60 py-8">
              No LLM invocation logs found for the selected period
            </div>
          ) : (
            <div className="space-y-3">
              {llmLogs.map((log) => (
                <div
                  key={log.id}
                  className="bg-burgundy/10 border border-cream/20 rounded-lg overflow-hidden"
                >
                  {/* Log Header - Always Visible */}
                  <div
                    className="p-4 cursor-pointer hover:bg-burgundy/20 transition-colors"
                    onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded text-xs font-bold ${
                            log.llm_called
                              ? 'bg-burgundy text-cream'
                              : 'bg-cream/20 text-cream/60'
                          }`}
                        >
                          {log.llm_called ? 'AI AGENT' : 'DIRECT API'}
                        </span>
                        <span className="text-cream text-sm">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            log.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {log.success ? 'SUCCESS' : 'FAILED'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-cream/70">
                        <span>{(log.processing_time_ms / 1000).toFixed(2)}s</span>
                        <span className="font-semibold">{log.cost_estimate}</span>
                        <svg
                          className={`w-5 h-5 transition-transform ${
                            expandedLogId === log.id ? 'rotate-180' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedLogId === log.id && (
                    <div className="p-4 bg-burgundy-dark/50 border-t border-cream/20 space-y-3">
                      {/* LLM Model */}
                      {log.llm_model && (
                        <div>
                          <p className="text-cream/60 text-xs font-medium mb-1">LLM Model</p>
                          <p className="text-cream font-mono text-sm">{log.llm_model}</p>
                        </div>
                      )}

                      {/* LLM Prompt */}
                      {log.llm_prompt && (
                        <div>
                          <p className="text-cream/60 text-xs font-medium mb-1">Prompt Sent to LLM</p>
                          <div className="bg-burgundy-dark p-3 rounded border border-cream/10">
                            <p className="text-cream font-mono text-sm">{log.llm_prompt}</p>
                          </div>
                        </div>
                      )}

                      {/* LLM Response */}
                      {log.llm_response && (
                        <div>
                          <p className="text-cream/60 text-xs font-medium mb-1">LLM Response</p>
                          <div className="bg-burgundy-dark p-3 rounded border border-cream/10 max-h-64 overflow-y-auto">
                            <p className="text-cream/80 font-mono text-sm whitespace-pre-wrap">
                              {log.llm_response}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Iterations */}
                      {log.llm_iterations !== null && (
                        <div>
                          <p className="text-cream/60 text-xs font-medium mb-1">Reasoning Iterations</p>
                          <p className="text-cream font-mono text-sm">{log.llm_iterations}</p>
                        </div>
                      )}

                      {/* Error Message */}
                      {log.error_message && (
                        <div>
                          <p className="text-red-400 text-xs font-medium mb-1">Error Message</p>
                          <div className="bg-red-500/10 border border-red-500/30 p-3 rounded">
                            <p className="text-red-300 font-mono text-sm">{log.error_message}</p>
                          </div>
                        </div>
                      )}

                      {/* Request Data */}
                      <div>
                        <p className="text-cream/60 text-xs font-medium mb-1">Request Details</p>
                        <div className="bg-burgundy-dark p-3 rounded border border-cream/10">
                          <pre className="text-cream/80 font-mono text-xs">
                            {JSON.stringify(log.request_data, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
