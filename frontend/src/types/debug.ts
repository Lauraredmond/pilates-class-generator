/**
 * Type definitions for debug utilities
 */

export interface MediaDebugInfo {
  timestamp: string;
  environment: {
    hostname: string;
    apiUrl: string;
    isStandalone: boolean;
    userAgent: string;
  };
  audioContext: {
    state: string;
    sampleRate: number;
    baseLatency?: number;
  };
  audioElements: {
    music: {
      count: number;
      currentSrc: string | null;
    };
    voiceover: {
      count: number;
      currentSrc: string | null;
    };
    errors: string[];
  };
  videoElements: {
    count: number;
    playing: number;
    currentSrc: string | null;
    errors: string[];
  };
  serviceWorker: {
    registered: boolean;
    state: string | null;
    scope: string | null;
  };
}

export interface MediaDebugLog {
  timestamp: string;
  type: 'music' | 'voiceover' | 'video';
  event: string;
  data?: any;
}
