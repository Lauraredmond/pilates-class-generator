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
  const [mode, setMode] = useState<BuilderMode>('auto'); // Default to auto mode
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

      {/* Page Header with Logo */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <img
            src="/assets/bassline-logo-2-yellow.png"
            alt="Bassline Logo"
            className="h-16 w-auto"
          />
          <div>
            <h1 className="text-3xl font-bold text-cream">Automatically Generate My Class</h1>
            <p className="text-cream/70 mt-1">
              Let AI create a personalized class based on your preferences
            </p>
          </div>
        </div>
      </div>

      {/* Mode Content */}
      <div className="flex-1 overflow-hidden">
        {mode === 'manual' ? <ManualClassBuilder /> : <AutoClassBuilder />}
      </div>
    </div>
  );
}
