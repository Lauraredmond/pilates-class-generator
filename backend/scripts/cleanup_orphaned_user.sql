-- Cleanup Orphaned User Record
-- This script removes the orphaned record from the 'users' table
-- after the 'user_profiles' table was already deleted

-- Step 1: Check if the orphaned record exists
SELECT id, email_token, created_at
FROM users
WHERE email_token = 'token_laura.redm@gmail.com';

-- Step 2: Delete the orphaned record
DELETE FROM users WHERE email_token = 'token_laura.redm@gmail.com';

-- Step 3: Verify deletion
SELECT * FROM users WHERE email_token = 'token_laura.redm@gmail.com';
-- Should return 0 rows

-- Step 4: Verify user_profiles is also clean (should return 0 rows)
SELECT * FROM user_profiles WHERE email = 'laura.redm@gmail.com';
-- Should return 0 rows

-- Step 5: Verify user_preferences is also clean (should return 0 rows)
SELECT * FROM user_preferences WHERE user_id IN (
    SELECT id FROM user_profiles WHERE email = 'laura.redm@gmail.com'
);
-- Should return 0 rows

-- After running this script, you can register again with laura.redm@gmail.com
