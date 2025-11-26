/**
 * Music Period Selector Component
 * Session 9: Music Integration
 *
 * Allows users to select a musical stylistic period for their Pilates class.
 * Displays period information, composers, and characteristics.
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface StylisticPeriodInfo {
  value: string;
  name: string;
  description: string;
  era: string;
  composers: string[];
  traits: string[];
}

interface MusicPeriodSelectorProps {
  selectedPeriod?: string;
  onPeriodSelect: (period: string) => void;
  className?: string;
}

const MusicPeriodSelector: React.FC<MusicPeriodSelectorProps> = ({
  selectedPeriod,
  onPeriodSelect,
  className = ''
}) => {
  const [periods, setPeriods] = useState<StylisticPeriodInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedPeriod, setExpandedPeriod] = useState<string | null>(null);

  useEffect(() => {
    fetchStylisticPeriods();
  }, []);

  const fetchStylisticPeriods = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/music/stylistic-periods`);
      setPeriods(response.data);
    } catch (err) {
      console.error('Failed to fetch stylistic periods:', err);
      setError('Unable to load musical periods. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodClick = (periodValue: string) => {
    // Toggle expansion
    setExpandedPeriod(expandedPeriod === periodValue ? null : periodValue);
    // Notify parent of selection
    onPeriodSelect(periodValue);
  };

  if (loading) {
    return (
      <div className={`music-period-selector ${className}`}>
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Loading musical periods...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`music-period-selector ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchStylisticPeriods}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`music-period-selector ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Select Musical Period</h3>
        <p className="text-sm text-gray-600">
          Choose the style of classical music that will accompany your Pilates class
        </p>
      </div>

      <div className="space-y-3">
        {periods.map((period) => {
          const isSelected = selectedPeriod === period.value;
          const isExpanded = expandedPeriod === period.value;

          return (
            <div
              key={period.value}
              className={`
                border rounded-lg transition-all duration-200 cursor-pointer
                ${isSelected
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'}
              `}
              onClick={() => handlePeriodClick(period.value)}
            >
              {/* Period Header */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-900">{period.name}</h4>
                      {isSelected && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-600 text-white">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{period.era}</p>
                    <p className="text-sm text-gray-700 mt-2">{period.description}</p>
                  </div>
                  <div className="ml-4">
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                        isExpanded ? 'transform rotate-180' : ''
                      }`}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    {/* Composers */}
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                        Notable Composers
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {period.composers.map((composer, idx) => (
                          <span
                            key={idx}
                            className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                          >
                            {composer}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Traits */}
                    <div>
                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                        Musical Characteristics
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {period.traits.map((trait, idx) => (
                          <span
                            key={idx}
                            className="inline-block bg-indigo-100 text-indigo-700 text-xs px-2 py-1 rounded"
                          >
                            {trait}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <svg
            className="h-5 w-5 text-blue-400 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="ml-3">
            <p className="text-sm text-blue-800">
              <strong>Royalty-Free Music:</strong> All music comes from Musopen and FreePD,
              public domain classical music collections. No ads, no subscriptions, just beautiful
              music for your Pilates practice.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPeriodSelector;
