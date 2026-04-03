/**
 * AutoClassBuilder - AI-powered class generation
 * Simplified layout: Single AI Generator panel
 */

import { AIGenerationPanel } from './AIGenerationPanel';

export function AutoClassBuilder() {
  return (
    <div className="h-full flex items-start justify-center">
      {/* AI Generator - Centered */}
      <div className="w-full max-w-2xl">
        <AIGenerationPanel />
      </div>
    </div>
  );
}
