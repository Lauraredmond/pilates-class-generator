-- Reset Health & Safety Acceptance for Testing
-- Run this in Supabase SQL Editor to force the H&S modal to show again

-- Reset for specific user (redmond_laura@yahoo.co.uk)
UPDATE user_profiles
SET accepted_safety_at = NULL
WHERE email = 'redmond_laura@yahoo.co.uk';

-- Verify the reset
SELECT id, email, full_name, accepted_safety_at
FROM user_profiles
WHERE email = 'redmond_laura@yahoo.co.uk';

-- Expected result: accepted_safety_at should be NULL

-- Alternative: Reset for laura.redm@gmail.com if that's the account
-- UPDATE user_profiles
-- SET accepted_safety_at = NULL
-- WHERE email = 'laura.redm@gmail.com';

-- Alternative: Reset for ALL users (use with caution!)
-- UPDATE user_profiles
-- SET accepted_safety_at = NULL;
