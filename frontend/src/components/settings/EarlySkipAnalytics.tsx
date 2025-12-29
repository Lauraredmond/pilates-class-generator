import { useState } from 'react';
import { Database } from 'lucide-react';
import { analyticsApi } from '../../services/api';
import { logger } from '../../utils/logger';

interface EarlySkipAnalyticsProps {
  userId: string;
}

interface DataSource {
  table_name: string;
  sql_query: string;
  description: string;
}

interface EarlySkipBySection {
  section_type: string;
  total_plays: number;
  early_skips: number;
  early_skip_rate_pct: number;
  avg_duration_seconds: number;
  avg_planned_duration: number;
}

interface EarlySkipByMovement {
  movement_id: string;
  movement_name: string;
  total_plays: number;
  early_skips: number;
  early_skip_rate_pct: number;
  avg_duration_seconds: number;
  avg_planned_duration: number;
}

interface EarlySkipAnalyticsData {
  by_section_type: EarlySkipBySection[];
  by_movement: EarlySkipByMovement[];
  overall_stats: {
    total_plays: number;
    total_early_skips: number;
    overall_skip_rate_pct: number;
  };
  data_sources: DataSource[];
}

export function EarlySkipAnalytics({ userId }: EarlySkipAnalyticsProps) {
  const [analytics, setAnalytics] = useState<EarlySkipAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedQuery, setCopiedQuery] = useState<string | null>(null);

  const handleViewEarlySkipAnalytics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await analyticsApi.getEarlySkipAnalytics({
        admin_user_id: userId,
      });
      setAnalytics(response.data);
    } catch (err: any) {
      logger.error('Failed to fetch early skip analytics:', err);
      if (err.response?.status === 403) {
        setError('Admin access required to view early skip analytics');
      } else {
        setError(err.response?.data?.detail || 'Failed to load early skip analytics');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const copySQL = (query: string, description: string) => {
    navigator.clipboard.writeText(query);
    setCopiedQuery(description);
    setTimeout(() => setCopiedQuery(null), 2000);
  };

  return (
    <div className="mb-6 p-4 bg-burgundy/10 rounded-lg border border-burgundy/20">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-lg font-semibold text-cream mb-2">Early Skip Analytics</h3>
          <p className="text-cream/60 text-sm mb-3">
            Track which sections users skip before the minimum engagement threshold across ALL platform users:
          </p>
          <ul className="text-cream/60 text-xs space-y-1 list-disc list-inside mb-3">
            <li>Platform-wide section skip rates (all users)</li>
            <li>Most-skipped movements ranked by skip rate</li>
            <li>SQL query transparency for data validation</li>
            <li>Threshold: 60s for sections, 20s for transitions</li>
          </ul>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        onClick={handleViewEarlySkipAnalytics}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-burgundy hover:bg-burgundy/90 text-cream px-4 py-3 rounded font-semibold transition-smooth disabled:opacity-50 disabled:cursor-not-allowed mb-3"
      >
        <Database className="w-5 h-5" />
        {isLoading ? 'Loading Analytics...' : 'View Early Skip Analytics'}
      </button>

      {analytics && (
        <div className="mt-4 space-y-4">
          {/* Overall Statistics */}
          <div className="p-4 bg-charcoal rounded border border-cream/20">
            <h4 className="text-md font-semibold text-cream mb-3">Overall Statistics (All Users)</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-burgundy/20 p-3 rounded">
                <p className="text-xs text-cream/60 mb-1">Total Section Plays</p>
                <p className="text-2xl font-bold text-cream">{analytics.overall_stats.total_plays}</p>
              </div>
              <div className="bg-burgundy/20 p-3 rounded">
                <p className="text-xs text-cream/60 mb-1">Total Early Skips</p>
                <p className="text-2xl font-bold text-cream">{analytics.overall_stats.total_early_skips}</p>
              </div>
              <div className={`p-3 rounded ${analytics.overall_stats.overall_skip_rate_pct > 30 ? 'bg-red-900/20 border border-red-500/30' : 'bg-green-900/20 border border-green-500/30'}`}>
                <p className={`text-xs mb-1 ${analytics.overall_stats.overall_skip_rate_pct > 30 ? 'text-red-400' : 'text-green-400'}`}>
                  Overall Skip Rate
                </p>
                <p className={`text-2xl font-bold ${analytics.overall_stats.overall_skip_rate_pct > 30 ? 'text-red-400' : 'text-green-400'}`}>
                  {analytics.overall_stats.overall_skip_rate_pct}%
                </p>
              </div>
            </div>
          </div>

          {/* Skip Rates by Section Type */}
          <div className="p-4 bg-charcoal rounded border border-cream/20">
            <h4 className="text-md font-semibold text-cream mb-3">Skip Rates by Section Type</h4>
            {analytics.by_section_type.length === 0 ? (
              <p className="text-cream/60 text-sm">No data yet - users need to start classes</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-burgundy/20">
                    <tr>
                      <th className="text-left p-2 text-cream">Section</th>
                      <th className="text-center p-2 text-cream">Plays</th>
                      <th className="text-center p-2 text-cream">Skips</th>
                      <th className="text-center p-2 text-cream">Rate</th>
                      <th className="text-center p-2 text-cream">Avg Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.by_section_type.map((section) => (
                      <tr key={section.section_type} className="border-b border-cream/10">
                        <td className="p-2 text-cream/70 capitalize">{section.section_type}</td>
                        <td className="p-2 text-center text-cream/70">{section.total_plays}</td>
                        <td className="p-2 text-center text-cream/70">{section.early_skips}</td>
                        <td className="p-2 text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              section.early_skip_rate_pct > 50
                                ? 'bg-red-500/20 text-red-400'
                                : section.early_skip_rate_pct > 20
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-green-500/20 text-green-400'
                            }`}
                          >
                            {section.early_skip_rate_pct}%
                          </span>
                        </td>
                        <td className="p-2 text-center text-cream/70">{section.avg_duration_seconds}s</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Top 10 Most-Skipped Movements */}
          <div className="p-4 bg-charcoal rounded border border-cream/20">
            <h4 className="text-md font-semibold text-cream mb-3">Top 10 Most-Skipped Movements</h4>
            {analytics.by_movement.length === 0 ? (
              <p className="text-cream/60 text-sm">No movement data yet (min 10 plays required)</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-burgundy/20">
                    <tr>
                      <th className="text-left p-2 text-cream">Rank</th>
                      <th className="text-left p-2 text-cream">Movement</th>
                      <th className="text-center p-2 text-cream">Plays</th>
                      <th className="text-center p-2 text-cream">Skips</th>
                      <th className="text-center p-2 text-cream">Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.by_movement.map((movement, index) => (
                      <tr key={movement.movement_id} className="border-b border-cream/10">
                        <td className="p-2 text-cream font-bold">#{index + 1}</td>
                        <td className="p-2 text-cream/70">{movement.movement_name}</td>
                        <td className="p-2 text-center text-cream/70">{movement.total_plays}</td>
                        <td className="p-2 text-center text-cream/70">{movement.early_skips}</td>
                        <td className="p-2 text-center">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              movement.early_skip_rate_pct > 50
                                ? 'bg-red-500/20 text-red-400'
                                : movement.early_skip_rate_pct > 20
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-green-500/20 text-green-400'
                            }`}
                          >
                            {movement.early_skip_rate_pct}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SQL Transparency */}
          <div className="p-4 bg-charcoal rounded border border-cream/20">
            <h4 className="text-md font-semibold text-cream mb-3">SQL Transparency</h4>
            <p className="text-cream/60 text-xs mb-3">
              Copy any SQL query to run it directly in Supabase SQL Editor for validation
            </p>
            <div className="space-y-3">
              {analytics.data_sources.map((source, index) => (
                <div key={index} className="bg-burgundy/10 border border-cream/20 rounded p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-cream font-semibold text-xs">Query #{index + 1}</p>
                      <p className="text-cream/60 text-xs">{source.description}</p>
                    </div>
                    <button
                      onClick={() => copySQL(source.sql_query, source.description)}
                      className="px-2 py-1 bg-burgundy text-cream rounded text-xs hover:bg-burgundy-dark transition-colors font-semibold"
                    >
                      {copiedQuery === source.description ? 'Copied!' : 'Copy SQL'}
                    </button>
                  </div>
                  <div className="bg-burgundy-dark p-2 rounded border border-cream/10 max-h-48 overflow-y-auto">
                    <pre className="text-cream/80 font-mono text-xs whitespace-pre-wrap">
                      {source.sql_query}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
