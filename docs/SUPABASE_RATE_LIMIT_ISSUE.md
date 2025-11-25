# Supabase Rate Limit Issue - Confirmed

**Date Identified:** November 25, 2025
**Status:** Confirmed - Supabase free tier limitation
**Impact:** Blocks all new user registrations
**Severity:** High (affects production user onboarding)

---

## 🔍 Issue Summary

Users attempting to register receive a `429 Too Many Requests` error with the message:

```
"Registration temporarily unavailable due to Supabase free tier email limits.
 Please try again in 24-48 hours, or contact support for immediate access."
```

---

## ✅ Diagnosis (Confirmed)

**Tests Performed:**
1. ✅ Tested with new, never-used email addresses → **Still rate limited**
2. ✅ Tested from different network (mobile data) → **Still rate limited**
3. ✅ Tested from different IP addresses → **Still rate limited**
4. ✅ Direct API test with unique email → **Still rate limited**

**Actual Supabase Error:**
```
"email rate limit exceeded"
```

**Conclusion:**
This is a **Supabase project-wide rate limit** on the free tier, specifically affecting email confirmation sending. It is **NOT**:
- User-specific (different emails don't help)
- IP-specific (different networks don't help)
- A bug in our code (Supabase service limitation)

---

## 📊 Supabase Free Tier Limits

According to Supabase documentation and observed behavior:

- **Email sending limit:** Very conservative (exact number undisclosed)
- **Rate limit scope:** Project-wide (affects all users)
- **Rate limit duration:** 24-48 hours (sometimes longer)
- **Auth operations:** Additional throttling on signup/signin
- **Design intent:** Intentionally restrictive to push users toward paid tiers

---

## 💰 Cost to Resolve

### **Option 1: Supabase Pro Tier**
- **Cost:** $25/month
- **Benefits:**
  - Much higher email sending limits
  - 100,000 MAU (Monthly Active Users)
  - Priority support
  - No arbitrary rate limits
- **Recommendation:** If AWS Activate doesn't come through

### **Option 2: AWS Migration (Pending Credits)**
- **Applied for:** AWS Activate funding programme
- **If approved:** $5,000-$100,000 in AWS credits
- **Migration plan:**
  - Replace Supabase → AWS Cognito + RDS/Aurora
  - Replace Render.com → AWS ECS/Fargate
  - Replace Netlify → AWS Amplify/S3+CloudFront
- **Benefits:**
  - No arbitrary rate limits
  - Better scalability
  - Professional infrastructure
  - AWS Cognito: 50,000 MAU free, then $0.0055 per MAU

### **Option 3: Disable Email Confirmation (Not Recommended)**
- **Cost:** Free
- **How:** Supabase Dashboard → Auth Settings → Disable "Enable email confirmations"
- **Risk:** Users not verified (security vulnerability)
- **Use case:** Development/testing only, NOT production

---

## 🛠️ Temporary Workarounds

### **For Testing (Development Only):**
1. Disable email confirmation in Supabase Dashboard
2. Manually confirm test users via Dashboard (Auth → Users → Confirm)
3. Wait 48 hours for rate limit reset

### **For Production:**
- Display clear error message (already implemented)
- Provide alternative contact method (email support directly)
- Upgrade to Supabase Pro or migrate to AWS

---

## 📝 Code Changes Made

**Backend (auth.py):**
```python
# Lines 110-115
if "rate limit" in error_message or "too many" in error_message or "email_rate_limit" in error_message:
    raise HTTPException(
        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
        detail="Registration temporarily unavailable due to Supabase free tier email limits.
                Please try again in 24-48 hours, or contact support for immediate access.",
        headers={"Retry-After": "7200"}  # 2 hours
    )
```

**Frontend (Register.tsx):**
- Enhanced error display with contextual help
- Shows actionable guidance when rate limit detected
- Explains this is a temporary service limitation

---

## 🎯 Long-Term Solution

**When AWS Activate Credits Approved:**
1. Migrate authentication to AWS Cognito
2. Migrate database to AWS RDS (PostgreSQL)
3. Migrate backend to AWS ECS/Fargate
4. Migrate frontend to AWS Amplify or S3+CloudFront
5. Complete infrastructure on AWS (no rate limit issues)

**Until Then:**
- Accept rate limit as temporary inconvenience
- Consider upgrading Supabase if critical
- Document limitation for early users

---

## 📚 References

- **Supabase Pricing:** https://supabase.com/pricing
- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth
- **AWS Cognito Pricing:** https://aws.amazon.com/cognito/pricing/
- **AWS Activate:** https://aws.amazon.com/activate/

---

## ✅ Status Updates

**November 25, 2025:**
- Issue confirmed as Supabase project-wide rate limit
- Error messaging improved for users
- Documentation created
- Awaiting AWS Activate approval for long-term solution
- No immediate action required (not blocking other development)

---

*Last Updated: November 25, 2025*
