#!/usr/bin/env python3
"""
Complete User Cleanup Script
Removes ALL traces of a user from ALL tables in the database

Usage:
    python backend/scripts/complete_user_cleanup.py laura.redm@gmail.com
"""

import sys
import os
from pathlib import Path

# Add backend to Python path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

from utils.supabase_client import supabase


def complete_user_cleanup(email: str):
    """
    Delete ALL traces of a user from ALL tables

    This is a nuclear option that removes:
    - user_profiles
    - users (tokenized email table)
    - user_preferences
    - class_plans
    - beta_feedback
    - compliance logs (ROPA, AI decisions, etc.)
    - Any other related records
    """
    print(f"\n🗑️  COMPLETE CLEANUP for: {email}")
    print("=" * 60)

    try:
        # 1. Find the user and get ID
        print("\n1️⃣  Looking up user account...")
        user_response = supabase.table("user_profiles").select("id, email, full_name, created_at").eq("email", email).execute()

        if not user_response.data:
            print(f"⚠️  No user found in user_profiles with email: {email}")
            user_id = None
        else:
            user = user_response.data[0]
            user_id = user['id']
            print(f"✅ Found user in user_profiles:")
            print(f"   - ID: {user_id}")
            print(f"   - Email: {user['email']}")
            print(f"   - Name: {user.get('full_name', 'N/A')}")
            print(f"   - Created: {user['created_at']}")

        # 2. Check users table separately (might exist even if user_profiles doesn't)
        print("\n2️⃣  Checking users table (tokenized email)...")
        users_response = supabase.table("users").select("id, email_token").eq("email_token", f"token_{email}").execute()

        if users_response.data:
            print(f"✅ Found user in users table:")
            print(f"   - Email token: token_{email}")
            if users_response.data[0]['id'] != user_id:
                print(f"   - Warning: ID mismatch! users.id={users_response.data[0]['id']}, user_profiles.id={user_id}")

        # 3. Count related records
        print("\n3️⃣  Checking related data...")
        tables_to_clean = []

        if user_id:
            # Check user_preferences
            try:
                prefs_response = supabase.table("user_preferences").select("id", count="exact").eq("user_id", user_id).execute()
                prefs_count = prefs_response.count if prefs_response.count else 0
                if prefs_count > 0:
                    tables_to_clean.append(("user_preferences", prefs_count))
                print(f"   - user_preferences: {prefs_count}")
            except:
                print(f"   - user_preferences: table not accessible or doesn't exist")

            # Check class_plans
            try:
                plans_response = supabase.table("class_plans").select("id", count="exact").eq("user_id", user_id).execute()
                plans_count = plans_response.count if plans_response.count else 0
                if plans_count > 0:
                    tables_to_clean.append(("class_plans", plans_count))
                print(f"   - class_plans: {plans_count}")
            except:
                print(f"   - class_plans: table not accessible or doesn't exist")

            # Check beta_feedback
            try:
                feedback_response = supabase.table("beta_feedback").select("id", count="exact").eq("user_id", user_id).execute()
                feedback_count = feedback_response.count if feedback_response.count else 0
                if feedback_count > 0:
                    tables_to_clean.append(("beta_feedback", feedback_count))
                print(f"   - beta_feedback: {feedback_count}")
            except:
                print(f"   - beta_feedback: table not accessible or doesn't exist")

        # 4. Delete from all tables (child tables first, then parent tables)
        print("\n4️⃣  Deleting all records...")

        total_deleted = 0

        if user_id:
            # Delete user_preferences
            try:
                result = supabase.table("user_preferences").delete().eq("user_id", user_id).execute()
                deleted_count = len(result.data) if result.data else 0
                if deleted_count > 0:
                    print(f"   ✅ Deleted {deleted_count} records from user_preferences")
                    total_deleted += deleted_count
            except Exception as e:
                print(f"   ⚠️  user_preferences: {str(e)}")

            # Delete class_plans
            try:
                result = supabase.table("class_plans").delete().eq("user_id", user_id).execute()
                deleted_count = len(result.data) if result.data else 0
                if deleted_count > 0:
                    print(f"   ✅ Deleted {deleted_count} records from class_plans")
                    total_deleted += deleted_count
            except Exception as e:
                print(f"   ⚠️  class_plans: {str(e)}")

            # Delete beta_feedback
            try:
                result = supabase.table("beta_feedback").delete().eq("user_id", user_id).execute()
                deleted_count = len(result.data) if result.data else 0
                if deleted_count > 0:
                    print(f"   ✅ Deleted {deleted_count} records from beta_feedback")
                    total_deleted += deleted_count
            except Exception as e:
                print(f"   ⚠️  beta_feedback: {str(e)}")

            # Delete compliance logs (ROPA, AI decisions, etc.)
            for table_name in ["ropa_audit_log", "ai_decision_log", "bias_monitoring", "model_drift_log"]:
                try:
                    result = supabase.table(table_name).delete().eq("user_id", user_id).execute()
                    deleted_count = len(result.data) if result.data else 0
                    if deleted_count > 0:
                        print(f"   ✅ Deleted {deleted_count} records from {table_name}")
                        total_deleted += deleted_count
                except:
                    pass  # Table might not exist

        # Delete from users table (by email_token)
        try:
            result = supabase.table("users").delete().eq("email_token", f"token_{email}").execute()
            deleted_count = len(result.data) if result.data else 0
            if deleted_count > 0:
                print(f"   ✅ Deleted {deleted_count} records from users (by email_token)")
                total_deleted += deleted_count
        except Exception as e:
            print(f"   ⚠️  users (by email_token): {str(e)}")

        # Delete from users table (by ID if we have it)
        if user_id:
            try:
                result = supabase.table("users").delete().eq("id", user_id).execute()
                deleted_count = len(result.data) if result.data else 0
                if deleted_count > 0:
                    print(f"   ✅ Deleted {deleted_count} records from users (by id)")
                    total_deleted += deleted_count
            except Exception as e:
                print(f"   ⚠️  users (by id): {str(e)}")

        # Delete from user_profiles (main table - do this LAST)
        try:
            result = supabase.table("user_profiles").delete().eq("email", email).execute()
            deleted_count = len(result.data) if result.data else 0
            if deleted_count > 0:
                print(f"   ✅ Deleted {deleted_count} records from user_profiles")
                total_deleted += deleted_count
        except Exception as e:
            print(f"   ⚠️  user_profiles: {str(e)}")

        # 5. Verify cleanup
        print("\n5️⃣  Verifying cleanup...")

        verification_failed = False

        # Check user_profiles
        result = supabase.table("user_profiles").select("id").eq("email", email).execute()
        if result.data:
            print(f"   ❌ user_profiles: {len(result.data)} records still exist!")
            verification_failed = True
        else:
            print(f"   ✅ user_profiles: clean (0 records)")

        # Check users table
        result = supabase.table("users").select("id").eq("email_token", f"token_{email}").execute()
        if result.data:
            print(f"   ❌ users: {len(result.data)} records still exist!")
            verification_failed = True
        else:
            print(f"   ✅ users: clean (0 records)")

        # Summary
        print("\n" + "=" * 60)
        if verification_failed:
            print("❌ Cleanup incomplete - some records still exist")
            print("   Please check the errors above and try manual cleanup via SQL")
            return False
        else:
            print(f"✅ Complete cleanup successful!")
            print(f"   - Total records deleted: {total_deleted}")
            print(f"   - Email {email} can now be registered again")
            return True

    except Exception as e:
        print(f"\n❌ Error during cleanup: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python backend/scripts/complete_user_cleanup.py <email>")
        print("Example: python backend/scripts/complete_user_cleanup.py laura.redm@gmail.com")
        sys.exit(1)

    email = sys.argv[1]

    # Confirm cleanup
    print(f"\n⚠️  WARNING: This will permanently delete ALL data for {email}")
    print("This includes:")
    print("  - User profile and account")
    print("  - User preferences and settings")
    print("  - All saved classes")
    print("  - All feedback submissions")
    print("  - All compliance/audit logs")
    print("\nThis action cannot be undone.")
    confirm = input("\nType 'DELETE ALL' to confirm: ")

    if confirm != "DELETE ALL":
        print("\n❌ Cleanup cancelled.")
        sys.exit(0)

    success = complete_user_cleanup(email)
    sys.exit(0 if success else 1)
