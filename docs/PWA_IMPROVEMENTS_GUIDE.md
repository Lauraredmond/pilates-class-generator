# PWA Experience Improvements (Battery-Friendly)

**Date:** January 12, 2026
**Status:** Implementation Phase 1 Complete
**Goal:** Enhance PWA user experience without draining battery or causing adverse effects

---

## 🔋 Battery-Friendly Improvements Implemented

### **1. Smart Service Worker**

**Location:** `/frontend/public/sw.js`

**Features:**
- **Offline support** - App works without internet
- **Instant loading** - Cached app shell loads immediately
- **Smart caching strategies:**
  - Network-first for API calls (fresh data priority)
  - Cache-first for static assets (performance priority)
  - Auto-expiring API cache (5-minute TTL)
- **Battery-friendly:**
  - No background polling
  - Only syncs when online
  - Uses `requestIdleCallback` for non-critical work

**Cache Strategies:**
- **App Shell (1 year cache):** Logo, index.html, critical assets
- **Assets (1 year cache):** JS, CSS, images, fonts, audio
- **API (5 minutes cache):** User data, class plans, preferences

### **2. Service Worker Registration**

**Location:** `/frontend/src/utils/registerServiceWorker.ts`

**Features:**
- Registers during browser idle time (doesn't block UI)
- Auto-updates check every 24 hours
- Update check when user returns to app (visibility change)
- User-friendly update prompts

**Battery Optimization:**
- Uses `requestIdleCallback` (Chrome, Edge)
- Delayed registration for Safari (1 second)
- No forced refreshes (user decides)

---

## 📊 Expected Performance Improvements

### **Before (No Service Worker):**
- First load: 2-3 seconds
- Subsequent loads: 1-2 seconds
- Offline: ❌ Broken
- Network requests per visit: 20-30

### **After (With Service Worker):**
- First load: 2-3 seconds (same)
- Subsequent loads: **< 0.5 seconds** (80% faster)
- Offline: ✅ **Works perfectly**
- Network requests per visit: **2-5** (90% reduction)

---

## 🛡️ What This DOESN'T Do (Battery Protection)

These features are **intentionally excluded** to preserve battery:

❌ Background location tracking
❌ Constant background sync
❌ Polling APIs every N seconds
❌ Heavy JavaScript computations
❌ Excessive wake locks
❌ Autoplay video
❌ Push notifications (planned for Phase 2)

---

## 📱 PWA Features Already Working

✅ **Add to Home Screen** - User can install app
✅ **Screen Wake Lock** - Prevents sleep during class playback (only when active)
✅ **Offline Manifest** - App icon, splash screen, theme color
✅ **Responsive Design** - Mobile-optimized UI

---

## 🚀 Phase 2 Improvements (Future)

### **3. Install Prompt**
- Smart prompt after 2+ visits
- "Add to Home Screen" button in Settings
- Track install analytics

### **4. Code Splitting**
- Lazy load Recording Mode
- Lazy load Analytics charts
- Lazy load Developer Tools
- **Expected:** 30% smaller initial bundle

### **5. Progressive Image Loading**
- Blur-up technique for images
- Lazy load images below fold
- WebP format with JPEG fallback

### **6. Preload Critical Resources**
- Fonts, CSS loaded immediately
- Hero images preloaded
- DNS prefetch for backend API

### **7. Background Sync (Optional)**
- Sync saved classes when online
- Upload analytics data in background
- Only when online + battery > 20%

### **8. Push Notifications (Optional)**
- Class reminders (opt-in only)
- Weekly summary notifications
- New feature announcements
- **Battery-friendly:** Grouped, max 2/day

---

## 🧪 Testing Checklist

### **Test Service Worker:**
1. Open app in Chrome DevTools
2. Application tab → Service Workers
3. Verify "bassline-v1" registered
4. Check Cache Storage → see 3 caches:
   - `bassline-v1` (app shell)
   - `bassline-assets-v1` (static files)
   - `bassline-api-v1` (API responses)

### **Test Offline Mode:**
1. Load app while online
2. Chrome DevTools → Network tab → Toggle "Offline"
3. Refresh page
4. App should still work (cached)
5. Try navigating to different pages
6. Error messages should be graceful

### **Test Update Flow:**
1. Make code change
2. Rebuild and deploy
3. Revisit app (don't refresh)
4. Should see update prompt in console
5. Refresh to get new version

### **Test Battery Impact:**
1. Open app on iPhone
2. Settings → Battery → Show Battery Usage
3. After 1 hour of normal use, check Bassline usage
4. Should be **< 5%** battery drain per hour (mostly from screen)

---

## 📐 Implementation Status

| Feature | Status | Battery Impact | Priority |
|---------|--------|----------------|----------|
| Service Worker | ✅ Complete | ✅ None | High |
| Smart Caching | ✅ Complete | ✅ None | High |
| Offline Support | ✅ Complete | ✅ None | High |
| Auto-updates | ✅ Complete | ✅ Minimal | High |
| Install Prompt | ⏸️ Phase 2 | ✅ None | Medium |
| Code Splitting | ⏸️ Phase 2 | ✅ Reduces load | Medium |
| Progressive Images | ⏸️ Phase 2 | ✅ Reduces data | Low |
| Background Sync | ⏸️ Phase 2 | ⚠️ Low | Low |
| Push Notifications | ⏸️ Optional | ⚠️ Low-Medium | Low |

---

## 🐛 Known Issues & Solutions

### **Issue 1: iOS PWA Cache Corruption**

**Symptoms:**
- App works in Safari browser
- Broken when launched from home screen icon
- Navigation bar appears mid-page

**Root Cause:**
- iOS caches PWA resources aggressively
- Memory pressure can corrupt cache
- Background eviction corrupts state

**Fix:**
1. Force quit PWA (swipe up from app switcher)
2. Relaunch from home screen
3. If persists: Delete home screen app, re-add from Safari

**Prevention:**
- Service worker provides better cache control
- Auto-clears old caches on update
- Graceful fallbacks for corrupted resources

### **Issue 2: Stale Content After Deploy**

**Symptoms:**
- User sees old version after deployment
- Features don't work as expected

**Root Cause:**
- Browser cached old service worker
- User hasn't refreshed since deploy

**Fix:**
- Service worker auto-checks for updates
- User sees update prompt
- Refresh to get new version

**Prevention:**
- `updateViaCache: 'none'` in registration
- Update check on visibility change
- 24-hour auto-update checks

---

## 🎯 Success Metrics

**User Experience:**
- App loads < 0.5s on repeat visits
- Works offline for 90% of use cases
- Zero crashes from cache corruption

**Performance:**
- 90% reduction in network requests
- 80% faster repeat loads
- 50% reduction in data usage

**Battery:**
- < 5% battery drain per hour of active use
- No background battery drain
- Wake lock only during class playback

**Reliability:**
- 99.9% uptime (works offline)
- Auto-recovery from cache issues
- Graceful degradation for old browsers

---

## 📚 Resources

**Service Worker API:**
- https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API

**PWA Best Practices:**
- https://web.dev/progressive-web-apps/

**Workbox (Google's SW library):**
- https://developers.google.com/web/tools/workbox

**Battery Optimization:**
- https://web.dev/optimize-for-low-power-mode/

---

## 🔄 Deployment Instructions

**Phase 1 (Current):**
```bash
# Already committed to dev branch
git checkout dev
git pull origin dev

# Build and deploy
cd frontend
npm run build
# Netlify auto-deploys from dev branch
```

**Testing:**
1. Visit https://bassline-dev.netlify.app
2. Open Chrome DevTools → Application → Service Workers
3. Verify "bassline-v1" registered
4. Check Cache Storage (3 caches)
5. Toggle offline, verify app still works

**Phase 2 (Future):**
- Merge dev → main after 1 week of testing
- Monitor battery usage analytics
- Gather user feedback on offline experience
- Implement Phase 2 features if needed
