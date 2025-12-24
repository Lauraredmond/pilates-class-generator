# Privacy Policy Update - Play Session Tracking
**Date:** December 24, 2025
**Purpose:** Add disclosure for play session tracking data collection

---

## Text to Add to Privacy Policy

### Section 2.C "Practice & Movement Data"

Add the following after the existing practice & movement data disclosures:

```
Play Session Data

When you play a Pilates class, we automatically track your interaction with the class to help us understand user engagement and improve the platform. We collect:

• Session Information:
  - When you started and ended the class
  - Total time spent playing the class
  - Whether you completed the entire class
  - Which section you reached (preparation, warmup, movements, etc.)
  - Furthest section you reached during the session

• Interaction Metrics:
  - Number of times you paused
  - Number of times you skipped forward
  - Number of times you rewound/went back
  - Playback source (library, generated, shared, preview)

• Device Information:
  - Browser type and version
  - Operating system
  - Screen width and height
  - Whether you're using a mobile device

Purpose: This data helps us:
- Distinguish between users who create classes vs. those who actually perform them
- Understand which classes are most engaging and completed
- Identify where users struggle or lose interest
- Improve the user experience based on interaction patterns
- Provide analytics for platform improvement

Qualified Plays: Sessions under 120 seconds (2 minutes) are not counted as "qualified plays" to filter out brief previews and accidental clicks. Only sessions where you engage for at least 2 minutes are included in our engagement metrics.

Legal Basis: Legitimate Interest (GDPR Article 6(1)(f)) - We have a legitimate interest in understanding how our platform is used to improve service quality. This does not override your fundamental rights and freedoms.

Your Control: You can view all your play sessions via Settings > Developer Tools (if you're an admin) or by contacting us to request your data under GDPR Article 15 (Right to Access). All play sessions are protected by Row-Level Security, ensuring you can only access your own data.

Data Storage: EU (Ireland) via Supabase
Data Retention: Duration of beta testing period, then reviewed
```

---

## Section 3 "How We Use Your Data"

Add to the list of data uses:

```
• Monitor Class Engagement: We track when and how users play classes (session duration, completion rates, interaction patterns) to understand user engagement and improve the platform. Sessions under 120 seconds are not counted as "qualified plays."
```

---

## Section 5 "Your Rights"

Ensure this section already includes (should already be there):

```
• Right to Access (GDPR Article 15): You can view all your play session data via Settings > Data Access & Compliance > Download My Data
• Right to Erasure (GDPR Article 17): When you delete your account, all play session data is permanently deleted
```

---

## Section 7 "Data Security"

Ensure this section mentions:

```
• Row-Level Security (RLS): Your play session data is protected by database-level security policies that ensure only you (and authorized administrators) can access your data.
```

---

## Records of Processing Activities (ROPA) Update

Add new processing activity to ROPA endpoint (`/backend/api/compliance.py`):

**Processing Activity ID:** `play_session_tracking`

**Data Categories:**
- Behavioral data (session timestamps, duration, completion status)
- Interaction metrics (pause, skip, rewind counts)
- Technical data (device information, browser, OS, screen size)

**Purpose:** User engagement analytics and platform improvement

**Legal Basis:** Legitimate Interest (GDPR Article 6(1)(f))

**Recipients:** Internal analytics team, platform administrators

**Storage Location:** EU (Ireland) - Supabase

**Retention Period:** Duration of beta testing, then reviewed

**Data Subject Rights:** Access, Erasure, Portability

---

## Compliance Verification Checklist

Before deploying:

- [ ] Privacy Policy updated with play session tracking disclosure
- [ ] ROPA updated with new processing activity
- [ ] `/api/compliance/my-data` endpoint includes play session data in exports
- [ ] Settings page "Download My Data" button exports play session data
- [ ] Database migration 034 executed in production
- [ ] Row-Level Security policies verified on `class_play_sessions` table
- [ ] User can view their own play statistics via `/api/analytics/user/{user_id}/play-statistics`

---

**Document Status:** ✅ Ready for Privacy Policy Update
**Estimated Time to Update:** 15 minutes
**Risk if Not Updated:** Low (data is non-sensitive, but GDPR requires transparency)
