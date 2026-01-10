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

  useEffect(() => {
    // Load Cast SDK dynamically
    const loadCastSdk = () => {
      // Check if already loaded
      if ((window as any).cast) {
        logger.debug('Cast SDK already loaded');
        return;
      }

      // Create script tag
      const script = document.createElement('script');
      script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
      script.async = true;

      script.onerror = () => {
        logger.error('Failed to load Google Cast SDK');
      };

      document.head.appendChild(script);
      logger.debug('Cast SDK script added to page');
    };

    loadCastSdk();
  }, []);

  useEffect(() => {
    // Wait for Cast framework to load
    const initializeCastApi = () => {
      const cast = (window as any).cast;
      if (!cast || !cast.framework) {
        logger.warn('Google Cast framework not loaded');
        return;
      }

      try {
        // Initialize Cast context with application ID
        // Using default Media Receiver app (generic audio/video player)
        const context = cast.framework.CastContext.getInstance();

        context.setOptions({
          receiverApplicationId: cast.framework.CastContext.DEFAULT_MEDIA_RECEIVER_APP_ID,
          autoJoinPolicy: cast.framework.AutoJoinPolicy.ORIGIN_SCOPED,
        });

        castContextRef.current = context;

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
              logger.debug('✅ Connected to Chromecast');
            } else if (devicesAvailable) {
              logger.debug('📡 Chromecast device(s) available');
            } else {
              logger.debug('❌ No Chromecast devices found');
            }
          }
        );

        // Check initial Cast state (may be NO_DEVICES_AVAILABLE during discovery)
        const castState = context.getCastState();
        setIsAvailable(castState !== cast.framework.CastState.NO_DEVICES_AVAILABLE);

        logger.debug(`Initial Cast state: ${castState}`);

        logger.debug('🎥 Google Cast initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize Cast API:', error);
      }
    };

    // Wait for Cast framework to be ready
    if ((window as any)['__onGCastApiAvailable']) {
      initializeCastApi();
    } else {
      (window as any)['__onGCastApiAvailable'] = (isAvailable: boolean) => {
        if (isAvailable) {
          initializeCastApi();
        }
      };
    }
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
