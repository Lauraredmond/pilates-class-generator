#!/usr/bin/env python3
"""
Delete User Account Script
Cleanly removes a user account from the database (GDPR right to erasure)

Usage:
    python backend/scripts/delete_user_account.py laura.redm@gmail.com
"""

import sys
import os
from pathlib import Path

# Add backend to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from utils.supabase_admin import supabase_admin


def delete_user_account(email: str):
    """
    Delete a user account and all associated data

    This follows GDPR Article 17 (Right to Erasure)
    Cascading deletes will remove all related data:
    - user_preferences
    - class_plans (if any)
    - feedback submissions
    - compliance logs
    """
    print(f"\n🗑️  Deleting account for: {email}")
    print("=" * 60)

    try:
        # 1. Find the user
        print("\n1️⃣  Looking up user account...")
        user_response = supabase_admin.table("user_profiles").select("id, email, full_name, created_at").eq("email", email).execute()

        if not user_response.data:
            print(f"❌ No account found with email: {email}")
            return False

        user = user_response.data[0]
        print(f"✅ Found user:")
        print(f"   - ID: {user['id']}")
        print(f"   - Email: {user['email']}")
        print(f"   - Name: {user.get('full_name', 'N/A')}")
        print(f"   - Created: {user['created_at']}")

        user_id = user['id']

        # 2. Count related records (for reporting)
        print("\n2️⃣  Checking related data...")

        # Check class plans
        class_plans_response = supabase_admin.table("class_plans").select("id", count="exact").eq("user_id", user_id).execute()
        class_plans_count = class_plans_response.count if class_plans_response.count else 0
        print(f"   - Class plans: {class_plans_count}")

        # Check preferences
        prefs_response = supabase_admin.table("user_preferences").select("id", count="exact").eq("user_id", user_id).execute()
        prefs_count = prefs_response.count if prefs_response.count else 0
        print(f"   - Preferences: {prefs_count}")

        # Check feedback
        feedback_response = supabase_admin.table("beta_feedback").select("id", count="exact").eq("user_id", user_id).execute()
        feedback_count = feedback_response.count if feedback_response.count else 0
        print(f"   - Feedback submissions: {feedback_count}")

        # 3. Delete user (cascading deletes will handle related records)
        print("\n3️⃣  Deleting user account...")
        delete_response = supabase_admin.table("user_profiles").delete().eq("id", user_id).execute()

        if delete_response.data:
            print(f"✅ Account deleted successfully!")
            print(f"\n📊 Summary:")
            print(f"   - Deleted user: {email}")
            print(f"   - Cascade deleted: {class_plans_count} class plans, {prefs_count} preferences, {feedback_count} feedback entries")
            print(f"\n✨ You can now register a new account with this email.\n")
            return True
        else:
            print(f"❌ Failed to delete account (no data returned)")
            return False

    except Exception as e:
        print(f"\n❌ Error deleting account: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python backend/scripts/delete_user_account.py <email>")
        print("Example: python backend/scripts/delete_user_account.py laura.redm@gmail.com")
        sys.exit(1)

    email = sys.argv[1]

    # Confirm deletion
    print(f"\n⚠️  WARNING: This will permanently delete the account for {email}")
    print("This action cannot be undone.")
    confirm = input("\nType 'DELETE' to confirm: ")

    if confirm != "DELETE":
        print("\n❌ Deletion cancelled.")
        sys.exit(0)

    success = delete_user_account(email)
    sys.exit(0 if success else 1)
