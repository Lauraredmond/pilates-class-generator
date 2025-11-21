/**
 * ClassBuilder - Parent Component with Mode Switching
 * Two modes: Manual creation and AI-powered generation
 */

import { useState, useEffect } from 'react';
import { ManualClassBuilder } from '../components/class-builder/ManualClassBuilder';
import { AutoClassBuilder } from '../components/class-builder/AutoClassBuilder';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import { Loading } from '../components/ui/Loading';

type BuilderMode = 'manual' | 'auto';

export function ClassBuilder() {
  const [mode, setMode] = useState<BuilderMode>('manual');
  const setMovements = useStore((state) => state.setMovements);
  const setIsLoading = useStore((state) => state.setIsLoading);
  const setError = useStore((state) => state.setError);
  const isLoading = useStore((state) => state.isLoading);
  const movements = useStore((state) => state.movements);

  // Load movements on mount
  useEffect(() => {
    const loadMovements = async () => {
      console.log('[ClassBuilder] useEffect triggered, movements.length:', movements.length);

      // Force fetch fresh data to ensure we have the latest API response
      // TODO: Add smart cache validation later
      console.log('[ClassBuilder] Force fetching movements from API...');
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get('/api/movements');
        console.log('[ClassBuilder] API response:', response.data?.length, 'movements received');

        if (response.data && Array.isArray(response.data)) {
          console.log('[ClassBuilder] Sample movement:', response.data[0]);
          setMovements(response.data);
        } else {
          console.error('[ClassBuilder] Invalid API response format:', response.data);
          setError('Invalid data format received from API');
        }
      } catch (error: any) {
        console.error('[ClassBuilder] Failed to load movements:', error);
        setError(error.message || 'Failed to load movements');
      } finally {
        setIsLoading(false);
      }
    };

    loadMovements();
  }, [setMovements, setIsLoading, setError]);

  if (isLoading && movements.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loading message="Loading movements..." />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col relative">
      {/* Version Indicator - for testing/debugging */}
      <div className="absolute top-2 right-2 z-50 text-xs text-cream/40 bg-burgundy-dark/80 px-2 py-1 rounded border border-cream/20">
        v: 5ad601d | Music Test #4 (API track)
      </div>

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-cream mb-2">Class Builder</h1>
        <p className="text-cream/70">
          {mode === 'manual'
            ? 'Drag and drop movements to build your perfect sequence'
            : 'Let AI create a personalized class based on your preferences'}
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="mb-6">
        <div className="inline-flex rounded-lg border border-cream/30 bg-burgundy-dark p-1">
          <button
            onClick={() => setMode('manual')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              mode === 'manual'
                ? 'bg-burgundy text-cream shadow-lg'
                : 'text-cream/60 hover:text-cream'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span>Manually Create My Class</span>
            </div>
          </button>
          <button
            onClick={() => setMode('auto')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              mode === 'auto'
                ? 'bg-burgundy text-cream shadow-lg'
                : 'text-cream/60 hover:text-cream'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                />
              </svg>
              <span>Automatically Generate My Class</span>
            </div>
          </button>
        </div>
      </div>

      {/* Mode Content */}
      <div className="flex-1 overflow-hidden">
        {mode === 'manual' ? <ManualClassBuilder /> : <AutoClassBuilder />}
      </div>
    </div>
  );
}
