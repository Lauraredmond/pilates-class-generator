# Supabase SMTP Setup for Beta Feedback Emails

This guide explains how to configure Supabase to send feedback emails to your Gmail account.

---

## Overview

When beta testers submit feedback via the "Beta Tester Feedback & Queries" form, you want to receive an email notification at your Gmail address. Supabase can send emails via SMTP once configured.

---

## Option 1: Gmail SMTP (Recommended for Personal Use)

### Step 1: Create Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Navigate to **Security** → **2-Step Verification**
3. Enable 2-Step Verification if not already enabled
4. Scroll down to **App passwords** and click it
5. Select app: **Mail**
6. Select device: **Other (Custom name)**
7. Enter name: **Bassline Pilates Supabase**
8. Click **Generate**
9. **Copy the 16-character password** (e.g., `abcd efgh ijkl mnop`)
   - Remove spaces: `abcdefghijklmnop`

### Step 2: Configure Supabase SMTP

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
2. Navigate to **Settings** → **Auth** → **SMTP Settings**
3. Enable SMTP and enter the following:

```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: your.email@gmail.com
SMTP Password: [Your 16-character app password]
Sender Email: your.email@gmail.com
Sender Name: Bassline Pilates
```

4. Click **Save**
5. Click **Send Test Email** to verify configuration

### Step 3: Update Backend Code (Future Enhancement)

Currently, feedback is stored in the database. To enable email notifications, uncomment this code in `backend/api/feedback.py`:

```python
# Send email notification via Supabase Auth
from supabase.client import Client
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_feedback_email(feedback: FeedbackSubmission, feedback_id: str):
    """Send email notification for new feedback"""

    subject = f"[Bassline Beta] {feedback.feedbackType.upper()}: {feedback.subject}"

    body = f"""
    New beta tester feedback received:

    Feedback ID: {feedback_id}
    From: {feedback.name} ({feedback.email})
    Country: {feedback.country}
    Type: {feedback.feedbackType}
    Subject: {feedback.subject}

    Message:
    {feedback.message}

    ---
    View in Supabase: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/editor/beta_feedback
    """

    # Use Supabase SMTP (configured in dashboard)
    msg = MIMEMultipart()
    msg['From'] = 'your.email@gmail.com'
    msg['To'] = 'your.email@gmail.com'  # Your Gmail address
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login('your.email@gmail.com', os.getenv('SMTP_PASSWORD'))
        server.send_message(msg)
        server.quit()
        print(f"✅ Feedback email sent for {feedback_id}")
    except Exception as e:
        print(f"❌ Failed to send email: {e}")
```

---

## Option 2: SendGrid (Recommended for Production)

SendGrid offers 100 emails/day on free tier (better deliverability than Gmail).

### Step 1: Create SendGrid Account

1. Sign up at https://sendgrid.com/
2. Verify your email address
3. Create an API key:
   - Go to **Settings** → **API Keys**
   - Click **Create API Key**
   - Name: **Bassline Pilates**
   - Permissions: **Full Access**
   - Copy the API key (starts with `SG.`)

### Step 2: Verify Sender Identity

1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Enter your email address
4. Check your inbox and click the verification link

### Step 3: Configure Supabase SMTP

```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey  (literally "apikey")
SMTP Password: [Your SendGrid API key]
Sender Email: your.email@gmail.com  (must be verified)
Sender Name: Bassline Pilates
```

### Step 4: Test

Send test email from Supabase dashboard to confirm configuration.

---

## Option 3: Supabase Built-in SMTP (Simplest)

Supabase provides built-in SMTP for auth emails. However, for custom emails (like feedback notifications), you'll need to use Supabase Edge Functions.

### Create Edge Function

Create `supabase/functions/send-feedback-email/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { feedback } = await req.json()

  // Use Supabase Auth's built-in SMTP
  const { data, error } = await fetch(
    `${Deno.env.get('SUPABASE_URL')}/auth/v1/admin/generate_link`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        type: 'email',
        email: 'your.email@gmail.com',
        data: {
          subject: `[Beta] ${feedback.subject}`,
          message: feedback.message
        }
      })
    }
  )

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  })
})
```

---

## Recommended Workflow

1. **Now (MVP):** Use Option 1 (Gmail SMTP) - simplest setup
2. **Post-MVP:** Switch to Option 2 (SendGrid) - better deliverability
3. **At Scale:** Implement Option 3 (Edge Functions) - most flexible

---

## Testing SMTP Configuration

### From Supabase Dashboard

1. Go to **Settings** → **Auth** → **SMTP Settings**
2. Click **Send Test Email**
3. Check your Gmail inbox (and spam folder)

### From Backend API

```bash
# Test feedback submission
curl -X POST https://pilates-class-generator-api3.onrender.com/api/feedback/submit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "country": "Ireland",
    "feedbackType": "bug",
    "subject": "Test feedback",
    "message": "This is a test message"
  }'
```

---

## Troubleshooting

### Gmail SMTP Not Working

**Problem:** "Username and Password not accepted"
- **Solution:** Use App Password, not your regular Gmail password
- **Check:** 2-Step Verification must be enabled

**Problem:** Emails go to spam
- **Solution:** Add SPF and DKIM records to your domain (requires custom domain)

### SendGrid Emails Not Sending

**Problem:** 401 Unauthorized
- **Solution:** Double-check API key copied correctly
- **Check:** Sender email must be verified in SendGrid dashboard

**Problem:** 403 Forbidden
- **Solution:** Verify sender identity in SendGrid
- **Check:** API key has "Full Access" permissions

---

## Email Template Example

Subject: `[Bassline Beta] BUG: Class playback audio not syncing`

Body:
```
New beta tester feedback received:

Feedback ID: 123e4567-e89b-12d3-a456-426614174000
From: Laura Redmond (laura@example.com)
Country: Ireland
Type: Bug Report
Subject: Class playback audio not syncing

Message:
When I play a class on mobile, the narrative scrolling is behind the voiceover audio by about 2 seconds.
This makes it hard to follow along. Desktop version works fine.

Browser: Safari iOS 17.2
Device: iPhone 14 Pro

---
View in Supabase: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/editor/beta_feedback
```

---

## Next Steps

1. ✅ Run migration `021_beta_feedback_table.sql` in Supabase SQL Editor
2. ✅ Create Gmail App Password
3. ✅ Configure Supabase SMTP (Settings → Auth → SMTP Settings)
4. ✅ Send test email from Supabase dashboard
5. ✅ Deploy backend with feedback endpoint
6. ✅ Test feedback form from frontend

**Your feedback emails will arrive at:** `your.email@gmail.com`

---

**Created:** December 9, 2025
**Updated:** December 9, 2025
**Status:** Ready for Configuration
