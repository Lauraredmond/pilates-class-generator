// Authentication and User Types

// User type represents the roles a user can have
export type UserType = 'practitioner' | 'pilates_instructor' | 'coach' | 'parent' | 'admin';

// Single profile record
export interface UserProfile {
  id: string;
  user_id: string;  // References auth.users
  email: string;
  full_name?: string;
  user_type: string;  // Can be: 'standard', 'coach', 'practitioner', 'pilates_instructor', 'parent', 'admin'
  age_range?: string;
  gender_identity?: string;
  country?: string;
  pilates_experience?: string;
  goals?: string[];
  created_at?: string;
  updated_at?: string;
}

// User with all their profiles
export interface User {
  id: string;  // auth.users id
  email: string;
  profiles?: UserProfile[];  // Array of all user profiles (one per role) - optional for backward compatibility
  full_name?: string;
  // Legacy single profile fields for backward compatibility
  user_type?: string;
  age_range?: string;
  gender_identity?: string;
  country?: string;
  pilates_experience?: string;
  goals?: string[];
  created_at?: string;
  updated_at?: string;
}

export interface RegistrationData {
  email: string;
  password: string;
  fullName?: string;
  roles?: string[];  // Array of roles to create profiles for
  userType?: 'standard' | 'coach';  // Legacy single role for backward compatibility
  ageRange?: string;
  genderIdentity?: string;
  country?: string;
  pilatesExperience?: string;
  goals?: string[];
  accepted_privacy_at: string;
  accepted_beta_terms_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

// Helper function to check if user has any coaching role
export function hasCoachingRole(user: User | null): boolean {
  if (!user) return false;
  // Check profiles array if available
  if (user.profiles && user.profiles.length > 0) {
    return user.profiles.some(p =>
      p.user_type === 'coach' ||
      p.user_type === 'pilates_instructor' ||
      p.user_type === 'admin'
    );
  }
  // Fall back to legacy single user_type
  const type = user.user_type;
  return type === 'coach' || type === 'pilates_instructor' || type === 'admin';
}

// Helper function to check if user can access Youth Hub as parent
export function canAccessParentDashboard(user: User | null): boolean {
  if (!user) return false;
  // Check profiles array if available
  if (user.profiles && user.profiles.length > 0) {
    return user.profiles.some(p => p.user_type === 'parent' || p.user_type === 'admin');
  }
  // Fall back to legacy single user_type
  const type = user.user_type;
  return type === 'parent' || type === 'admin';
}

// Helper function to check if user can access Youth Hub as coach
export function canAccessCoachDashboard(user: User | null): boolean {
  if (!user) return false;
  // Check profiles array if available
  if (user.profiles && user.profiles.length > 0) {
    return user.profiles.some(p => p.user_type === 'coach' || p.user_type === 'admin');
  }
  // Fall back to legacy single user_type
  const type = user.user_type;
  return type === 'coach' || type === 'admin';
}

// Helper function to check if user can access Pilates coach tools
export function canAccessPilatesCoachTools(user: User | null): boolean {
  if (!user) return false;
  // Check profiles array if available
  if (user.profiles && user.profiles.length > 0) {
    return user.profiles.some(p => p.user_type === 'pilates_instructor' || p.user_type === 'admin');
  }
  // Fall back to legacy single user_type
  const type = user.user_type;
  return type === 'pilates_instructor' || type === 'admin';
}

// Helper function to get all user roles for display
export function getUserRolesDisplay(user: User): string {
  if (user.profiles && user.profiles.length > 0) {
    const roleNames = user.profiles.map(p => {
      switch (p.user_type) {
        case 'admin': return 'Administrator';
        case 'pilates_instructor': return 'Pilates Instructor';
        case 'coach': return 'Sports Coach';
        case 'parent': return 'Parent';
        case 'practitioner':
        case 'standard': return 'Pilates Practitioner';
        default: return p.user_type;
      }
    });
    return roleNames.join(', ');
  }
  // Fall back to legacy display
  return getUserRoleDisplay(user);
}

// Legacy helper function for single role display
export function getUserRoleDisplay(user: User): string {
  switch (user.user_type) {
    case 'admin':
      return 'Administrator';
    case 'pilates_instructor':
      return 'Pilates Instructor';
    case 'coach':
      return 'Sports Coach';
    case 'parent':
      return 'Parent';
    case 'practitioner':
    case 'standard':
      return 'Pilates Practitioner';
    default:
      return 'User';
  }
}