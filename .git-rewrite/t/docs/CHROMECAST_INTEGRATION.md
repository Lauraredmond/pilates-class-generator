# Chromecast Integration Options for Bassline Pilates

## Overview

This document outlines three approaches to enable users to cast Pilates classes from the web app to their TV via Chromecast or other casting devices.

---

## Option 1: Google Cast SDK (Recommended for Native Experience)

### Difficulty: **Medium-Hard**
### Time Estimate: **15-20 hours**
### Cost: **Free** (Google Cast SDK is free to use)

### Description
Implement native Google Cast functionality using the Cast SDK for Chrome. This provides the best user experience with a dedicated Cast button and full playback controls on the TV.

### How It Works
1. User clicks Cast button in browser
2. Selects their Chromecast device
3. Custom receiver app loads on TV
4. Class playback continues on TV with remote control support

### Implementation Steps

#### 1. Register Cast Receiver App (1 hour)
```bash
# Register at Google Cast SDK Developer Console
https://cast.google.com/publish/

# Create new application
# Get Application ID (e.g., "ABCD1234")
```

#### 2. Create Custom Receiver (4-6 hours)
Create `/public/chromecast-receiver.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <script src="//www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js"></script>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #3a0909; /* burgundy background */
      color: #f5f1e8; /* cream text */
      font-family: Arial, sans-serif;
      display: flex;
      align-items: center;
      justify-center;
      height: 100vh;
    }
    #content {
      max-width: 80%;
      text-align: center;
      font-size: 2rem;
      line-height: 1.8;
    }
    .title {
      font-size: 3rem;
      font-weight: bold;
      margin-bottom: 2rem;
    }
  </style>
</head>
<body>
  <div id="content">
    <div class="title">Bassline Pilates</div>
    <div id="narrative">Loading class...</div>
  </div>

  <script>
    const context = cast.framework.CastReceiverContext.getInstance();

    // Handle custom messages from sender
    context.addCustomMessageListener('urn:x-cast:com.bassline.pilates', (event) => {
      const data = event.data;

      if (data.type === 'UPDATE_NARRATIVE') {
        document.getElementById('narrative').innerText = data.narrative;
      }

      if (data.type === 'PLAY_AUDIO') {
        // Handle voiceover/music playback
        const audio = new Audio(data.audioUrl);
        audio.play();
      }
    });

    context.start();
  </script>
</body>
</html>
```

#### 3. Add Cast Sender to Frontend (6-8 hours)

Add to `/frontend/src/components/cast/ChromecastButton.tsx`:

```typescript
import { useEffect, useState } from 'react';

declare global {
  interface Window {
    __onGCastApiAvailable: (isAvailable: boolean) => void;
    chrome: {
      cast: any;
    };
  }
}

export function ChromecastButton() {
  const [castAvailable, setCastAvailable] = useState(false);
  const [castSession, setCastSession] = useState<any>(null);

  useEffect(() => {
    // Load Cast SDK
    const script = document.createElement('script');
    script.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
    document.body.appendChild(script);

    window['__onGCastApiAvailable'] = (isAvailable: boolean) => {
      if (isAvailable) {
        const cast = window.chrome.cast;

        // Initialize Cast API
        cast.framework.CastContext.getInstance().setOptions({
          receiverApplicationId: 'YOUR_APP_ID_HERE', // From Google Cast Console
          autoJoinPolicy: cast.framework.AutoJoinPolicy.ORIGIN_SCOPED,
        });

        setCastAvailable(true);

        // Listen for session changes
        const context = cast.framework.CastContext.getInstance();
        context.addEventListener(
          cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
          (event: any) => {
            if (event.sessionState === 'SESSION_STARTED') {
              setCastSession(context.getCurrentSession());
            } else if (event.sessionState === 'SESSION_ENDED') {
              setCastSession(null);
            }
          }
        );
      }
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const sendMessage = (message: any) => {
    if (castSession) {
      castSession.sendMessage('urn:x-cast:com.bassline.pilates', message);
    }
  };

  // Use in ClassPlayback to send narrative/audio updates
  const updateNarrative = (narrative: string) => {
    sendMessage({
      type: 'UPDATE_NARRATIVE',
      narrative: narrative
    });
  };

  if (!castAvailable) return null;

  return (
    <div className="google-cast-button">
      {/* Cast button automatically added by SDK */}
      <google-cast-launcher />
    </div>
  );
}
```

#### 4. Integrate with ClassPlayback (3-4 hours)

Modify `ClassPlayback.tsx` to send updates to Cast receiver when casting:

```typescript
// Detect when casting
const [isCasting, setIsCasting] = useState(false);

useEffect(() => {
  if (isCasting && castSession) {
    // Send current narrative to TV
    castSession.sendMessage('urn:x-cast:com.bassline.pilates', {
      type: 'UPDATE_NARRATIVE',
      narrative: currentNarrative
    });

    // Send voiceover audio
    if (currentVoiceover) {
      castSession.sendMessage('urn:x-cast:com.bassline.pilates', {
        type: 'PLAY_AUDIO',
        audioUrl: currentVoiceover
      });
    }
  }
}, [currentItem, isCasting]);
```

### Pros
✅ Native Cast button in browser
✅ Full playback controls on TV
✅ Works with all Chromecast devices
✅ Professional user experience
✅ Supports custom UI on TV
✅ Free to use (no licensing fees)

### Cons
❌ Most complex implementation
❌ Requires custom receiver app hosting
❌ Need to maintain two UIs (web + TV)
❌ Requires Google Cast Console account
❌ Testing requires physical Chromecast device

---

## Option 2: Web Presentation API (Standards-Based)

### Difficulty: **Medium**
### Time Estimate: **8-12 hours**
### Cost: **Free**

### Description
Use the Web Presentation API (W3C standard) to cast the web app to compatible devices. Simpler than Google Cast SDK but with broader device support.

### How It Works
1. Detect if Presentation API is available
2. Request presentation display
3. Open connection to second screen
4. Mirror or customize content for TV

### Implementation

#### 1. Add Presentation Button (2-3 hours)

```typescript
// frontend/src/components/cast/PresentationButton.tsx
import { useState, useEffect } from 'react';

export function PresentationButton() {
  const [canPresent, setCanPresent] = useState(false);
  const [presentation, setPresentation] = useState<PresentationConnection | null>(null);

  useEffect(() => {
    // Check if Presentation API is available
    if ('PresentationRequest' in window) {
      setCanPresent(true);
    }
  }, []);

  const startPresentation = async () => {
    try {
      // Request to present current page
      const request = new PresentationRequest([window.location.href]);

      // Start presentation
      const connection = await request.start();
      setPresentation(connection);

      // Send messages to presentation display
      connection.addEventListener('message', (event) => {
        console.log('Received from presentation:', event.data);
      });

      // Handle close
      connection.addEventListener('close', () => {
        setPresentation(null);
      });

    } catch (error) {
      console.error('Failed to start presentation:', error);
    }
  };

  if (!canPresent) return null;

  return (
    <button
      onClick={startPresentation}
      className="flex items-center gap-2 bg-burgundy text-cream px-4 py-2 rounded"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
      {presentation ? 'Presenting...' : 'Cast to TV'}
    </button>
  );
}
```

#### 2. Add Presentation Receiver Page (3-4 hours)

Create `/public/presentation-receiver.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Bassline Pilates - TV Display</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background: #3a0909;
      color: #f5f1e8;
      font-family: Arial, sans-serif;
      font-size: 3rem;
      display: flex;
      align-items: center;
      justify-center;
      height: 100vh;
    }
    #content {
      max-width: 80%;
      text-align: center;
      line-height: 1.8;
    }
  </style>
</head>
<body>
  <div id="content">Loading class...</div>

  <script>
    // Listen for messages from controller
    navigator.presentation.receiver.connectionList.then((list) => {
      list.connections.forEach((connection) => {
        connection.addEventListener('message', (event) => {
          const data = JSON.parse(event.data);

          if (data.type === 'UPDATE_NARRATIVE') {
            document.getElementById('content').innerText = data.narrative;
          }
        });
      });
    });
  </script>
</body>
</html>
```

#### 3. Send Updates from ClassPlayback (3-5 hours)

```typescript
// Send narrative updates to presentation display
useEffect(() => {
  if (presentationConnection) {
    presentationConnection.send(JSON.stringify({
      type: 'UPDATE_NARRATIVE',
      narrative: currentNarrative
    }));
  }
}, [currentItem]);
```

### Pros
✅ Standards-based (W3C specification)
✅ Works with Chromecast and other devices
✅ Simpler than Google Cast SDK
✅ No registration or app ID needed
✅ Free to use

### Cons
❌ Limited browser support (Chrome, Edge)
❌ Less control than native Cast SDK
❌ Fewer features than Cast SDK
❌ Requires separate receiver page

---

## Option 3: Native Browser Tab Casting (Easiest)

### Difficulty: **None (Already Works)**
### Time Estimate: **0 hours (documentation only)**
### Cost: **Free**

### Description
Users can already cast the web app using Chrome's built-in tab casting feature. This requires no code changes, just user education.

### How It Works
1. User opens Bassline Pilates in Chrome browser
2. Clicks the three-dot menu → Cast
3. Selects their Chromecast device
4. Entire browser tab mirrors to TV

### Implementation

#### Add Help Documentation (1 hour)

Create `/frontend/src/pages/CastingHelp.tsx`:

```typescript
export function CastingHelp() {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold text-cream mb-6">
        How to Cast to Your TV
      </h1>

      <div className="bg-burgundy-dark/40 rounded-lg p-6 mb-6">
        <h2 className="text-2xl font-semibold text-cream mb-4">
          Using Chrome Browser
        </h2>
        <ol className="list-decimal list-inside space-y-3 text-cream/90">
          <li>Open Bassline Pilates in Chrome browser on your computer or phone</li>
          <li>Click the three-dot menu (⋮) in the top-right corner</li>
          <li>Select "Cast..."</li>
          <li>Choose your Chromecast or compatible TV</li>
          <li>Select "Cast tab" (not "Cast desktop")</li>
          <li>Start your class - it will appear on your TV!</li>
        </ol>
      </div>

      <div className="bg-burgundy-dark/40 rounded-lg p-6">
        <h2 className="text-2xl font-semibold text-cream mb-4">
          Tips for Best Experience
        </h2>
        <ul className="list-disc list-inside space-y-2 text-cream/90">
          <li>Use a laptop/computer for better performance</li>
          <li>Close other browser tabs to reduce lag</li>
          <li>Ensure your device and Chromecast are on the same Wi-Fi network</li>
          <li>Use Chrome browser (other browsers may not support casting)</li>
        </ul>
      </div>
    </div>
  );
}
```

Add Cast icon/help link to ClassBuilder page:

```typescript
<button
  onClick={() => navigate('/help/casting')}
  className="flex items-center gap-2 text-cream/70 hover:text-cream"
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
  How to Cast to TV
</button>
```

### Pros
✅ **Zero development time** (already works)
✅ No code changes needed
✅ Works with any casting device
✅ Simple for users
✅ No maintenance burden
✅ Free

### Cons
❌ Mirrors entire browser tab (not optimized for TV)
❌ Shows browser UI (address bar, etc.)
❌ Less professional appearance
❌ Requires user education
❌ Performance depends on device specs

---

## Recommendation

### For MVP (Now): **Option 3 - Native Browser Casting**
- **Why**: Zero development time, already works, focus on core features
- **Action**: Add help documentation page explaining how to cast
- **Cost**: Free
- **Time**: 1 hour for documentation

### Post-PMF (6-12 months): **Option 1 - Google Cast SDK**
- **Why**: Professional experience, full control, brand consistency
- **When**: After validating product-market fit with 100+ active users
- **Cost**: Free (development time only)
- **Time**: 15-20 hours

### Alternative (If Needed): **Option 2 - Presentation API**
- **Why**: Standards-based middle ground
- **When**: If users request native casting but Google Cast SDK is too complex
- **Cost**: Free
- **Time**: 8-12 hours

---

## Cost-Benefit Analysis

| Option | Dev Time | Ongoing Cost | User Experience | Recommendation |
|--------|----------|--------------|-----------------|----------------|
| **Native Browser Casting** | 0 hours | $0/mo | Good | ✅ **MVP** |
| **Presentation API** | 8-12 hours | $0/mo | Better | Consider later |
| **Google Cast SDK** | 15-20 hours | $0/mo | Best | ✅ **Post-PMF** |

---

## Next Steps

1. **Immediate (This Week)**
   - Add "How to Cast to TV" help page
   - Test tab casting with Chromecast
   - Document casting instructions

2. **Post-MVP (6-12 months)**
   - Evaluate user demand for native casting
   - Implement Google Cast SDK if 20%+ users request it
   - A/B test casting vs non-casting user retention

3. **Future Enhancements**
   - Apple AirPlay support for iOS users
   - Roku channel integration
   - Smart TV native apps (Samsung, LG)

---

## References

- [Google Cast SDK Documentation](https://developers.google.com/cast/docs/web_sender)
- [Web Presentation API](https://developer.mozilla.org/en-US/docs/Web/API/Presentation_API)
- [Chrome Tab Casting Help](https://support.google.com/chromecast/answer/3228332)

---

**Last Updated:** December 9, 2025
**Status:** Documentation Complete - Native Casting Already Available
