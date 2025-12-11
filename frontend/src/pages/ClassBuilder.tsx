/**
 * ClassBuilder - Automated Class Generation
 * Automatically generates Pilates classes using Pilates theory-driven rulesets and student's class history
 */

import { useEffect } from 'react';
import { AutoClassBuilder } from '../components/class-builder/AutoClassBuilder';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import { Loading } from '../components/ui/Loading';
import { logger } from '../utils/logger';

export function ClassBuilder() {
  const setMovements = useStore((state) => state.setMovements);
  const setIsLoading = useStore((state) => state.setIsLoading);
  const setError = useStore((state) => state.setError);
  const isLoading = useStore((state) => state.isLoading);
  const movements = useStore((state) => state.movements);

  // Load movements on mount
  useEffect(() => {
    const loadMovements = async () => {
      logger.debug('[ClassBuilder] Loading movements');

      // Force fetch fresh data to ensure we have the latest API response
      // TODO: Add smart cache validation later
      setIsLoading(true);
      setError(null);

      try {
        const response = await api.get('/api/movements');
        logger.debug('[ClassBuilder] Movements loaded');

        if (response.data && Array.isArray(response.data)) {
          setMovements(response.data);
        } else {
          logger.error('[ClassBuilder] Invalid API response format');
          setError('Invalid data format received from API');
        }
      } catch (error: any) {
        logger.error('[ClassBuilder] Failed to load movements:', error);
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
      {/* Page Header with Logo */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <img
            src="/assets/bassline-logo-transparent.png"
            alt="Bassline Logo"
            className="h-16 w-auto"
          />
          <div>
            <h1 className="text-3xl font-bold text-cream">Automatically Generate My Class</h1>
            <p className="text-cream/70 mt-1">
            Creates a class shaped by your level, history, and classical Pilates principles
            </p>
          </div>
        </div>
      </div>

      {/* AI Class Generation */}
      <div className="flex-1 overflow-hidden">
        <AutoClassBuilder />
      </div>
    </div>
  );
}
