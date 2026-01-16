import { useEffect, useRef, useState } from 'react';
import { Cast } from 'lucide-react';
import { logger } from '../utils/logger';

interface CastButtonProps {
  onCastStateChange?: (isCasting: boolean) => void;
}

export function CastButton({ onCastStateChange }: CastButtonProps) {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isCasting, setIsCasting] = useState(false);
  const castContextRef = useRef<any>(null);

  // Note: Cast SDK is loaded via <script> tag in index.html (not dynamically here)
  // This avoids duplicate loading issues

  useEffect(() => {
    // CRITICAL: Use direct console.warn() to ensure logs appear in production
    try {
      console.warn('🔍 [CastButton] Component mounted - Cast SDK check starting...');
      console.warn('🔍 [CastButton] window.cast exists?', !!(window as any).cast);
      console.warn('🔍 [CastButton] window.cast.framework exists?', !!(window as any).cast?.framework);
      console.warn('🔍 [CastButton] window.cast.framework.CastContext exists?', !!(window as any).cast?.framework?.CastContext);
      console.warn('🔍 [CastButton] Full window.cast object:', (window as any).cast);
    } catch (error) {
      console.error('❌ [CastButton] Error during initial diagnostics:', error);
    }
    logger.debug('[CastButton] Component mounted, waiting for Cast SDK...');

    // Wait for Cast framework to load
    const initializeCastApi = () => {
      logger.debug('[CastButton] Attempting to initialize Cast API...');

      const cast = (window as any).cast;

      // Verify Cast SDK is FULLY loaded (not just partially)
      // CRITICAL: Must check for ORIGIN_SCOPED property, not just AutoJoinPolicy object
      if (
        !cast ||
        !cast.framework ||
        !cast.framework.CastContext ||
        !cast.framework.AutoJoinPolicy ||
        !cast.framework.AutoJoinPolicy.ORIGIN_SCOPED  // ← Check actual property!
      ) {
        logger.warn('[CastButton] Cast framework not fully loaded yet', {
          cast: !!cast,
          framework: !!cast?.framework,
          CastContext: !!cast?.framework?.CastContext,
          AutoJoinPolicy: !!cast?.framework?.AutoJoinPolicy,
          ORIGIN_SCOPED: !!cast?.framework?.AutoJoinPolicy?.ORIGIN_SCOPED,  // ← Log this too!
        });
        return;
      }

      try {
        logger.debug('[CastButton] Cast framework fully loaded, creating context...');

        // Initialize Cast context with application ID
        // Using default Media Receiver app (generic audio/video player)
        const context = cast.framework.CastContext.getInstance();

        context.setOptions({
          receiverApplicationId: cast.framework.CastContext.DEFAULT_MEDIA_RECEIVER_APP_ID,
          autoJoinPolicy: cast.framework.AutoJoinPolicy.ORIGIN_SCOPED,
        });

        castContextRef.current = context;
        logger.debug('[CastButton] Cast context created successfully');

        // Listen for cast state changes
        context.addEventListener(
          cast.framework.CastContextEventType.CAST_STATE_CHANGED,
          (event: any) => {
            const castState = event.castState;
            const isConnected = castState === cast.framework.CastState.CONNECTED;

            setIsCasting(isConnected);
            onCastStateChange?.(isConnected);

            // Update isAvailable whenever state changes (device discovery is async)
            const devicesAvailable = castState !== cast.framework.CastState.NO_DEVICES_AVAILABLE;
            setIsAvailable(devicesAvailable);

            if (isConnected) {
              logger.debug('[CastButton] ✅ Connected to Chromecast');
            } else if (devicesAvailable) {
              logger.debug('[CastButton] 📡 Chromecast device(s) available');
            } else {
              logger.debug('[CastButton] ❌ No Chromecast devices found');
            }
          }
        );

        // Check initial Cast state (may be NO_DEVICES_AVAILABLE during discovery)
        const castState = context.getCastState();
        setIsAvailable(castState !== cast.framework.CastState.NO_DEVICES_AVAILABLE);

        logger.debug(`[CastButton] Initial Cast state: ${castState}`);
        logger.debug('[CastButton] 🎥 Google Cast initialized successfully');
      } catch (error) {
        logger.error('[CastButton] Failed to initialize Cast API:', error);
      }
    };

    // Check if Cast SDK is fully loaded (not just partially)
    const cast = (window as any).cast;
    const isFullyLoaded =
      cast?.framework?.CastContext &&
      cast?.framework?.AutoJoinPolicy &&
      cast?.framework?.AutoJoinPolicy?.ORIGIN_SCOPED;  // ← Check actual property!

    if (isFullyLoaded) {
      logger.debug('[CastButton] Cast SDK fully loaded, initializing immediately');
      initializeCastApi();
    } else {
      logger.debug('[CastButton] Cast SDK not fully loaded yet, setting up callback and polling...');

      // Wait for Cast framework to be ready via callback
      (window as any)['__onGCastApiAvailable'] = (isAvailable: boolean) => {
        logger.debug(`[CastButton] __onGCastApiAvailable callback fired: ${isAvailable}`);
        if (isAvailable) {
          // Callback fired, but SDK might still be loading - poll until fully ready
          const pollInterval = setInterval(() => {
            const cast = (window as any).cast;
            if (
              cast?.framework?.CastContext &&
              cast?.framework?.AutoJoinPolicy &&
              cast?.framework?.AutoJoinPolicy?.ORIGIN_SCOPED  // ← Check actual property!
            ) {
              clearInterval(pollInterval);
              initializeCastApi();
            }
          }, 100); // Check every 100ms

          // Clear polling after 5 seconds if still not ready
          setTimeout(() => clearInterval(pollInterval), 5000);
        } else {
          logger.error('[CastButton] Cast API reported as NOT available');
        }
      };

      // Also poll directly in case callback doesn't fire
      let pollCount = 0;
      const directPollInterval = setInterval(() => {
        const cast = (window as any).cast;
        pollCount++;

        // Log detailed SDK state every 2 seconds (every 20 polls) - PRODUCTION LOGGING
        if (pollCount % 20 === 0) {
          console.warn(`🔍 [CastButton] Polling attempt ${pollCount}: SDK state`, {
            cast: !!cast,
            framework: !!cast?.framework,
            CastContext: !!cast?.framework?.CastContext,
            AutoJoinPolicy: !!cast?.framework?.AutoJoinPolicy,
            ORIGIN_SCOPED: !!cast?.framework?.AutoJoinPolicy?.ORIGIN_SCOPED,
            ORIGIN_SCOPED_value: cast?.framework?.AutoJoinPolicy?.ORIGIN_SCOPED,
          });
        }

        if (
          cast?.framework?.CastContext &&
          cast?.framework?.AutoJoinPolicy &&
          cast?.framework?.AutoJoinPolicy?.ORIGIN_SCOPED  // ← Check actual property!
        ) {
          clearInterval(directPollInterval);
          logger.debug(`[CastButton] Cast SDK detected via polling after ${pollCount} attempts`);
          initializeCastApi();
        }
      }, 100); // Check every 100ms

      // Clear polling after 10 seconds
      setTimeout(() => clearInterval(directPollInterval), 10000);
    }

    // Timeout safety net: if Cast SDK doesn't load in 10 seconds, log warning
    const timeout = setTimeout(() => {
      if (!castContextRef.current) {
        logger.warn('[CastButton] Cast SDK did not load within 10 seconds - button will remain disabled');
      }
    }, 10000);

    return () => clearTimeout(timeout);
  }, [onCastStateChange]);

  const handleCastClick = () => {
    const cast = (window as any).cast;
    if (!cast || !castContextRef.current) {
      logger.warn('Cast framework not available');
      return;
    }

    try {
      // Open cast dialog
      castContextRef.current.requestSession();
    } catch (error) {
      logger.error('Failed to request Cast session:', error);
    }
  };

  // Always show button (like Les Mills app) - more discoverable
  // Gray out if no devices available
  return (
    <button
      onClick={handleCastClick}
      disabled={!isAvailable && !isCasting}
      className={`p-2 rounded-lg transition-colors ${
        isCasting
          ? 'bg-burgundy text-cream'
          : isAvailable
          ? 'bg-cream/10 text-cream/70 hover:bg-cream/20'
          : 'bg-cream/5 text-cream/30 cursor-not-allowed'
      }`}
      title={
        isCasting
          ? 'Connected to TV'
          : isAvailable
          ? 'Cast to TV'
          : 'No Cast devices found'
      }
      aria-label={
        isCasting
          ? 'Connected to TV'
          : isAvailable
          ? 'Cast to TV'
          : 'No Cast devices found'
      }
    >
      <Cast className="w-6 h-6" />
    </button>
  );
}
