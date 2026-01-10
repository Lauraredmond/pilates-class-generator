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

            if (isConnected) {
              logger.debug('✅ Connected to Chromecast');
            } else {
              logger.debug('❌ Disconnected from Chromecast');
            }
          }
        );

        // Check if Cast is available
        const castState = context.getCastState();
        setIsAvailable(castState !== cast.framework.CastState.NO_DEVICES_AVAILABLE);

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

  // Don't show button if Cast is not available
  if (!isAvailable) {
    return null;
  }

  return (
    <button
      onClick={handleCastClick}
      className={`p-2 rounded-lg transition-colors ${
        isCasting
          ? 'bg-burgundy text-cream'
          : 'bg-cream/10 text-cream/70 hover:bg-cream/20'
      }`}
      title={isCasting ? 'Connected to TV' : 'Cast to TV'}
      aria-label={isCasting ? 'Connected to TV' : 'Cast to TV'}
    >
      <Cast className="w-6 h-6" />
    </button>
  );
}
