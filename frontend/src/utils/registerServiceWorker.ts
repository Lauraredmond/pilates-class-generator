// Service Worker Registration
// Battery-friendly: Only updates when app is idle

export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      // Wait for page to finish loading (battery-friendly)
      if (document.readyState === 'loading') {
        await new Promise(resolve => {
          document.addEventListener('DOMContentLoaded', resolve);
        });
      }

      // Register during idle time (doesn't block main thread)
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => doRegister());
      } else {
        // Fallback for Safari
        setTimeout(() => doRegister(), 1000);
      }
    } catch (error) {
      console.error('Service worker registration failed:', error);
    }
  }
}

async function doRegister() {
  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none' // Always check for updates
    });

    console.log('✅ Service Worker registered:', registration.scope);

    // Check for updates every 24 hours (battery-friendly)
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // New version available - notify user
          console.log('🔄 New app version available. Refresh to update.');

          // Optional: Show user-friendly update prompt
          if (confirm('New version available! Reload to update?')) {
            window.location.reload();
          }
        }
      });
    });

    // Update check on visibility change (when user returns to app)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        registration.update();
      }
    });

  } catch (error) {
    console.error('Service worker registration error:', error);
  }
}

export async function unregisterServiceWorker() {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.unregister();
      console.log('Service Worker unregistered');
    }
  }
}
