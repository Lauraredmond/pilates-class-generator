/**
 * Analytics Dashboard - Session 6
 * Displays user progress, charts, and insights
 */

import { Card, CardBody, CardHeader, CardTitle } from '../components/ui/Card';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
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
  Filler,
} from 'chart.js';
import { useState } from 'react';

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
  Legend,
  Filler
);

// Mock data for demonstration (will be replaced with real API data)
const mockStats = {
  totalClasses: 42,
  totalPracticeTime: 2580, // minutes
  currentStreak: 7, // days
  favoriteMovement: 'The Hundred',
  classesThisWeek: 5,
  avgClassDuration: 61, // minutes
};

const mockPracticeFrequency = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [
    {
      label: 'Minutes Practiced',
      data: [60, 45, 0, 75, 60, 90, 30],
      borderColor: 'rgb(252, 231, 187)', // cream
      backgroundColor: 'rgba(252, 231, 187, 0.2)',
      fill: true,
      tension: 0.4,
    },
  ],
};

const mockMuscleDistribution = {
  labels: ['Core', 'Legs', 'Arms', 'Back', 'Full Body'],
  datasets: [
    {
      label: 'Muscle Group Focus (%)',
      data: [35, 25, 15, 20, 5],
      backgroundColor: [
        'rgba(252, 231, 187, 0.8)', // cream
        'rgba(179, 119, 90, 0.8)',  // brown
        'rgba(147, 51, 66, 0.8)',   // burgundy
        'rgba(252, 231, 187, 0.6)',
        'rgba(179, 119, 90, 0.6)',
      ],
      borderColor: 'rgb(252, 231, 187)',
      borderWidth: 2,
    },
  ],
};

const mockDifficultyProgression = {
  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
  datasets: [
    {
      label: 'Beginner',
      data: [8, 6, 4, 2],
      backgroundColor: 'rgba(34, 197, 94, 0.7)', // green
    },
    {
      label: 'Intermediate',
      data: [2, 4, 6, 7],
      backgroundColor: 'rgba(234, 179, 8, 0.7)', // yellow
    },
    {
      label: 'Advanced',
      data: [0, 1, 2, 4],
      backgroundColor: 'rgba(239, 68, 68, 0.7)', // red
    },
  ],
};

const mockTopMovements = {
  labels: ['The Hundred', 'Roll Up', 'Teaser', 'Swimming', 'Plank'],
  datasets: [
    {
      label: 'Times Used',
      data: [38, 35, 28, 25, 22],
      backgroundColor: 'rgba(147, 51, 66, 0.8)', // burgundy
      borderColor: 'rgb(252, 231, 187)',
      borderWidth: 1,
    },
  ],
};

// Movement History data (from Excel screenshot)
const mockMovementHistory = [
  { movement: 'The Hundred', week1: 1, week2: 1, week3: 1, week4: 1, week5: 1, total: 5 },
  { movement: 'Roll Up', week1: 1, week2: 1, week3: 1, week4: 1, week5: 0, total: 4 },
  { movement: 'Roll Over', week1: 0, week2: 1, week3: 0, week4: 0, week5: 0, total: 1 },
  { movement: 'Single Leg Circle', week1: 1, week2: 1, week3: 1, week4: 1, week5: 1, total: 5 },
  { movement: 'Rolling Like a Ball', week1: 1, week2: 1, week3: 1, week4: 1, week5: 1, total: 5 },
  { movement: 'Single Leg Stretch', week1: 1, week2: 1, week3: 1, week4: 1, week5: 1, total: 5 },
  { movement: 'Double Leg Stretch', week1: 1, week2: 1, week3: 1, week4: 1, week5: 1, total: 5 },
  { movement: 'Scissors', week1: 0, week2: 1, week3: 1, week4: 1, week5: 1, total: 4 },
  { movement: 'Bicycle', week1: 0, week2: 1, week3: 1, week4: 1, week5: 0, total: 3 },
  { movement: 'Spine Stretch Forward', week1: 1, week2: 1, week3: 1, week4: 1, week5: 1, total: 5 },
  { movement: 'Open Leg Rocker', week1: 0, week2: 1, week3: 1, week4: 1, week5: 1, total: 4 },
  { movement: 'Corkscrew', week1: 0, week2: 0, week3: 1, week4: 1, week5: 1, total: 3 },
  { movement: 'The Saw', week1: 1, week2: 1, week3: 1, week4: 1, week5: 1, total: 5 },
  { movement: 'Swan Dive', week1: 1, week2: 1, week3: 1, week4: 1, week5: 1, total: 5 },
  { movement: 'Single Leg Kick', week1: 1, week2: 1, week3: 1, week4: 1, week5: 1, total: 5 },
  { movement: 'Double Leg Kick', week1: 1, week2: 1, week3: 1, week4: 1, week5: 1, total: 5 },
  { movement: 'Neck Pull', week1: 0, week2: 0, week3: 1, week4: 1, week5: 1, total: 3 },
  { movement: 'Shoulder Bridge', week1: 0, week2: 0, week3: 0, week4: 1, week5: 1, total: 2 },
  { movement: 'Spine Twist', week1: 1, week2: 1, week3: 1, week4: 1, week5: 1, total: 5 },
  { movement: 'Teaser', week1: 0, week2: 0, week3: 1, week4: 1, week5: 1, total: 3 },
];

// Muscle Group History data (from Excel screenshot)
const mockMuscleGroupHistory = [
  { group: 'Core Strength', week1: 7, week2: 7, week3: 7, week4: 7, week5: 5, total: 33 },
  { group: 'Hip Flexor Strengthening', week1: 3, week2: 4, week3: 4, week4: 4, week5: 2, total: 17 },
  { group: 'Pelvic Stability', week1: 5, week2: 5, week3: 5, week4: 5, week5: 5, total: 25 },
  { group: 'Spinal Articulation', week1: 4, week2: 5, week3: 5, week4: 5, week5: 4, total: 23 },
  { group: 'Hip Flexor Stretch', week1: 3, week2: 3, week3: 3, week4: 3, week5: 3, total: 15 },
  { group: 'Hamstring Stretch', week1: 2, week2: 3, week3: 3, week4: 3, week5: 2, total: 13 },
  { group: 'Lateral Flexion', week1: 1, week2: 1, week3: 1, week4: 1, week5: 1, total: 5 },
  { group: 'Spinal Extension', week1: 2, week2: 2, week3: 2, week4: 2, week5: 2, total: 10 },
  { group: 'Rotation', week1: 2, week2: 2, week3: 3, week4: 3, week5: 2, total: 12 },
  { group: 'Balance', week1: 0, week2: 1, week3: 1, week4: 1, week5: 1, total: 4 },
  { group: 'Chest Stretch', week1: 1, week2: 1, week3: 1, week4: 1, week5: 1, total: 5 },
  { group: 'Coordination', week1: 5, week2: 5, week3: 5, week4: 5, week5: 5, total: 25 },
  { group: 'Erector Spinae Stretch', week1: 2, week2: 2, week3: 2, week4: 2, week5: 2, total: 10 },
];

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      labels: {
        color: 'rgb(252, 231, 187)', // cream text
        font: {
          family: "'Inter', sans-serif",
          size: 12,
        },
      },
    },
    tooltip: {
      backgroundColor: 'rgba(40, 7, 14, 0.95)', // burgundy-dark
      titleColor: 'rgb(252, 231, 187)',
      bodyColor: 'rgb(252, 231, 187)',
      borderColor: 'rgb(252, 231, 187)',
      borderWidth: 1,
    },
  },
  scales: {
    x: {
      ticks: {
        color: 'rgba(252, 231, 187, 0.7)',
      },
      grid: {
        color: 'rgba(252, 231, 187, 0.1)',
      },
    },
    y: {
      ticks: {
        color: 'rgba(252, 231, 187, 0.7)',
      },
      grid: {
        color: 'rgba(252, 231, 187, 0.1)',
      },
    },
  },
};

export function Analytics() {
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year'>('week');

  const handleExportCSV = () => {
    // Export stats as CSV
    const csvData = `Metric,Value
Total Classes,${mockStats.totalClasses}
Total Practice Time (min),${mockStats.totalPracticeTime}
Current Streak (days),${mockStats.currentStreak}
Favorite Movement,${mockStats.favoriteMovement}
Classes This Week,${mockStats.classesThisWeek}
Avg Class Duration (min),${mockStats.avgClassDuration}`;

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pilates-analytics.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
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
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-burgundy text-cream rounded-lg hover:bg-burgundy-dark transition-colors font-semibold"
          >
            Print Report
          </button>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="mb-6">
        <div className="inline-flex rounded-lg border border-cream/30 bg-burgundy-dark p-1">
          {(['week', 'month', 'year'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-6 py-2 rounded-lg font-semibold transition-all capitalize ${
                dateRange === range
                  ? 'bg-burgundy text-cream shadow-lg'
                  : 'text-cream/60 hover:text-cream'
              }`}
            >
              {range}
            </button>
          ))}
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
                <p className="text-4xl font-bold text-cream mt-2">{mockStats.totalClasses}</p>
              </div>
              <div className="h-16 w-16 rounded-full bg-burgundy/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <p className="text-cream/50 text-xs mt-3">+{mockStats.classesThisWeek} this week</p>
          </CardBody>
        </Card>

        {/* Practice Time */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cream/60 text-sm font-medium">Practice Time</p>
                <p className="text-4xl font-bold text-cream mt-2">
                  {Math.floor(mockStats.totalPracticeTime / 60)}h {mockStats.totalPracticeTime % 60}m
                </p>
              </div>
              <div className="h-16 w-16 rounded-full bg-burgundy/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-cream/50 text-xs mt-3">~{mockStats.avgClassDuration} min avg</p>
          </CardBody>
        </Card>

        {/* Current Streak */}
        <Card>
          <CardBody className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-cream/60 text-sm font-medium">Current Streak</p>
                <p className="text-4xl font-bold text-cream mt-2">{mockStats.currentStreak} days</p>
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
                <p className="text-xl font-bold text-cream mt-2">{mockStats.favoriteMovement}</p>
              </div>
              <div className="h-16 w-16 rounded-full bg-burgundy/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-cream" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
            </div>
            <p className="text-cream/50 text-xs mt-3">Used 38 times</p>
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
              <Line data={mockPracticeFrequency} options={chartOptions} />
            </div>
          </CardBody>
        </Card>

        {/* Muscle Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Muscle Group Distribution</CardTitle>
          </CardHeader>
          <CardBody className="p-6">
            <div className="h-64">
              <Doughnut
                data={mockMuscleDistribution}
                options={{
                  ...chartOptions,
                  scales: undefined, // Doughnut doesn't use scales
                }}
              />
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
              <Bar
                data={mockDifficultyProgression}
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    legend: {
                      ...chartOptions.plugins.legend,
                      position: 'bottom' as const,
                    },
                  },
                }}
              />
            </div>
          </CardBody>
        </Card>

        {/* Top Movements Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Movements</CardTitle>
          </CardHeader>
          <CardBody className="p-6">
            <div className="h-64">
              <Bar
                data={mockTopMovements}
                options={{
                  ...chartOptions,
                  indexAxis: 'y' as const,
                }}
              />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Insights Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Insights & Recommendations</CardTitle>
        </CardHeader>
        <CardBody className="p-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-4 bg-burgundy/20 rounded-lg border border-cream/20">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-green-600/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-cream mb-1">Great consistency!</h4>
                <p className="text-cream/70 text-sm">
                  You've maintained a {mockStats.currentStreak}-day streak. Your regular practice is building strong foundations.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-burgundy/20 rounded-lg border border-cream/20">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-600/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-cream mb-1">Progressing to intermediate</h4>
                <p className="text-cream/70 text-sm">
                  You're incorporating more intermediate movements. Consider adding 2-3 more advanced exercises next week.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-burgundy/20 rounded-lg border border-cream/20">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-yellow-600/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-cream mb-1">Balance your muscle groups</h4>
                <p className="text-cream/70 text-sm">
                  Your core work is excellent (35%), but try to increase arm exercises to at least 20% for better balance.
                </p>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Movement History Table */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Movement History (Week by Week)</CardTitle>
        </CardHeader>
        <CardBody className="p-6">
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
                {mockMovementHistory.map((row, index) => (
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
        </CardBody>
      </Card>

      {/* Muscle Group History Table */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Muscle Group History (Week by Week)</CardTitle>
        </CardHeader>
        <CardBody className="p-6">
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
                {mockMuscleGroupHistory.map((row, index) => (
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
        </CardBody>
      </Card>
    </div>
  );
}
