/**
 * Debug Utilities for iOS PWA Debugging
 *
 * Provides on-device console (eruda) and custom media diagnostics panel
 * for debugging audio/video issues in iOS standalone mode
 */

import type { MediaDebugInfo } from '../types/debug';

/**
 * Initialize eruda debug console
 * Only loads in dev environment or when debug mode is explicitly enabled
 */
export function initDebugConsole() {
  // Check if debug mode is enabled
  const debugEnabled =
    import.meta.env.DEV ||
    localStorage.getItem('bassline_debug_mode') === 'true' ||
    window.location.hostname.includes('bassline-dev');

  if (!debugEnabled) {
    console.log('[Debug] Debug console disabled');
    return;
  }

  // Dynamically import eruda to avoid loading in production
  import('eruda').then(eruda => {
    eruda.default.init();
    console.log('[Debug] ✅ Eruda debug console initialized');

    // Add custom panel for media diagnostics
    addMediaDebugPanel(eruda.default);
  }).catch(err => {
    console.error('[Debug] Failed to load eruda:', err);
  });
}

/**
 * Add custom media diagnostics panel to eruda
 */
function addMediaDebugPanel(eruda: any) {
  const MediaPanel = eruda.Tool.extend({
    name: 'Media',
    init($el: HTMLElement) {
      this._$el = $el;
      this.refresh();
    },

    refresh() {
      const info = collectMediaDebugInfo();

      this._$el.innerHTML = `
        <div style="padding: 10px; font-family: monospace; font-size: 12px; line-height: 1.6;">
          <h3 style="margin: 0 0 10px 0; color: #4CAF50;">🎵 Media Diagnostics</h3>

          <div style="margin-bottom: 15px;">
            <strong>Environment</strong><br/>
            Host: ${info.environment.hostname}<br/>
            Backend: ${info.environment.apiUrl}<br/>
            Standalone: ${info.environment.isStandalone ? '✅ Yes' : '❌ No'}<br/>
            User Agent: ${info.environment.userAgent.substring(0, 50)}...
          </div>

          <div style="margin-bottom: 15px;">
            <strong>Audio Context</strong><br/>
            State: ${info.audioContext.state}<br/>
            Sample Rate: ${info.audioContext.sampleRate} Hz<br/>
            Base Latency: ${info.audioContext.baseLatency?.toFixed(3) || 'N/A'} s
          </div>

          <div style="margin-bottom: 15px;">
            <strong>Active Audio Elements</strong><br/>
            Music: ${info.audioElements.music.count} elements<br/>
            Voiceover: ${info.audioElements.voiceover.count} elements<br/>
            Errors: ${info.audioElements.errors.length}
          </div>

          <div style="margin-bottom: 15px;">
            <strong>Active Video Elements</strong><br/>
            Count: ${info.videoElements.count}<br/>
            Playing: ${info.videoElements.playing}<br/>
            Errors: ${info.videoElements.errors.length}
          </div>

          <div style="margin-bottom: 15px;">
            <strong>Service Worker</strong><br/>
            Registered: ${info.serviceWorker.registered ? '✅ Yes' : '❌ No'}<br/>
            ${info.serviceWorker.registered ? `State: ${info.serviceWorker.state}<br/>` : ''}
            ${info.serviceWorker.registered ? `Scope: ${info.serviceWorker.scope}` : ''}
          </div>

          ${info.audioElements.errors.length > 0 ? `
            <div style="margin-bottom: 15px; color: #f44336;">
              <strong>Audio Errors</strong><br/>
              ${info.audioElements.errors.map(e => `- ${e}`).join('<br/>')}
            </div>
          ` : ''}

          ${info.videoElements.errors.length > 0 ? `
            <div style="margin-bottom: 15px; color: #f44336;">
              <strong>Video Errors</strong><br/>
              ${info.videoElements.errors.map(e => `- ${e}`).join('<br/>')}
            </div>
          ` : ''}

          <button
            onclick="window.location.reload()"
            style="padding: 8px 16px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;"
          >
            🔄 Refresh Diagnostics
          </button>
        </div>
      `;
    },

    show() {
      this.refresh();
    }
  });

  eruda.add(new MediaPanel());
  console.log('[Debug] ✅ Media diagnostics panel added');
}

/**
 * Collect current media debug information
 */
export function collectMediaDebugInfo(): MediaDebugInfo {
  const audioElements = document.querySelectorAll('audio');
  const videoElements = document.querySelectorAll('video');

  // Get AudioContext if exists (from useAudioDucking)
  const audioContext = (window as any).__AUDIO_CONTEXT__;

  return {
    timestamp: new Date().toISOString(),
    environment: {
      hostname: window.location.hostname,
      apiUrl: localStorage.getItem('api_base_url') || 'unknown',
      isStandalone: window.matchMedia('(display-mode: standalone)').matches,
      userAgent: navigator.userAgent,
    },
    audioContext: {
      state: audioContext?.state || 'not-created',
      sampleRate: audioContext?.sampleRate || 0,
      baseLatency: audioContext?.baseLatency,
    },
    audioElements: {
      music: {
        count: Array.from(audioElements).filter(a => a.id.includes('music') || a.className.includes('music')).length,
        currentSrc: Array.from(audioElements).find(a => a.id.includes('music'))?.currentSrc || null,
      },
      voiceover: {
        count: Array.from(audioElements).filter(a => a.id.includes('voiceover')).length,
        currentSrc: Array.from(audioElements).find(a => a.id.includes('voiceover'))?.currentSrc || null,
      },
      errors: Array.from(audioElements)
        .filter(a => a.error)
        .map(a => `${a.id || 'unknown'}: ${a.error?.message || 'Unknown error'}`),
    },
    videoElements: {
      count: videoElements.length,
      playing: Array.from(videoElements).filter(v => !v.paused).length,
      currentSrc: videoElements[0]?.currentSrc || null,
      errors: Array.from(videoElements)
        .filter(v => v.error)
        .map(v => `Video error: ${v.error?.message || 'Unknown error'}`),
    },
    serviceWorker: {
      registered: 'serviceWorker' in navigator && !!navigator.serviceWorker.controller,
      state: navigator.serviceWorker.controller?.state || null,
      scope: navigator.serviceWorker.controller?.scriptURL || null,
    },
  };
}

/**
 * Enable/disable debug mode
 */
export function setDebugMode(enabled: boolean) {
  if (enabled) {
    localStorage.setItem('bassline_debug_mode', 'true');
    console.log('[Debug] Debug mode ENABLED - reload page to activate console');
  } else {
    localStorage.removeItem('bassline_debug_mode');
    console.log('[Debug] Debug mode DISABLED - reload page to deactivate console');
  }
}

/**
 * Check if debug mode is enabled
 */
export function isDebugMode(): boolean {
  return (
    import.meta.env.DEV ||
    localStorage.getItem('bassline_debug_mode') === 'true' ||
    window.location.hostname.includes('bassline-dev')
  );
}

/**
 * Log media event to debug console and eruda
 */
export function logMediaEvent(type: 'music' | 'voiceover' | 'video', event: string, data?: any) {
  const timestamp = new Date().toISOString();
  const message = `[Media:${type}] ${event}`;

  console.log(message, data || '');

  // Store in session for debugging
  const logs = JSON.parse(sessionStorage.getItem('media_debug_logs') || '[]');
  logs.push({ timestamp, type, event, data });

  // Keep only last 100 events
  if (logs.length > 100) {
    logs.shift();
  }

  sessionStorage.setItem('media_debug_logs', JSON.stringify(logs));
}

/**
 * Get media debug logs from session
 */
export function getMediaDebugLogs() {
  return JSON.parse(sessionStorage.getItem('media_debug_logs') || '[]');
}

/**
 * Clear media debug logs
 */
export function clearMediaDebugLogs() {
  sessionStorage.removeItem('media_debug_logs');
  console.log('[Debug] Media debug logs cleared');
}
