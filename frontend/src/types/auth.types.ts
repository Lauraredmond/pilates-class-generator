// Authentication and User Types

// User type represents the single role a user has chosen for this account
export type UserType = 'practitioner' | 'pilates_instructor' | 'coach' | 'parent' | 'admin';

export interface User {
  id: string;
  email: string;
  full_name?: string;
  user_type?: string;  // Can be: 'standard', 'coach', 'practitioner', 'pilates_instructor', 'parent', 'admin'
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
  userType?: 'standard' | 'coach';  // Maps to database values for backward compatibility
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
export function hasCoachingRole(user: User): boolean {
  const type = user.user_type;
  return type === 'coach' || type === 'pilates_instructor' || type === 'admin';
}

// Helper function to check if user can access Youth Hub as parent
export function canAccessParentDashboard(user: User): boolean {
  const type = user.user_type;
  return type === 'parent' || type === 'admin';
}

// Helper function to check if user can access Youth Hub as coach
export function canAccessCoachDashboard(user: User): boolean {
  const type = user.user_type;
  return type === 'coach' || type === 'admin';
}

// Helper function to check if user can access Pilates coach tools
export function canAccessPilatesCoachTools(user: User): boolean {
  const type = user.user_type;
  return type === 'pilates_instructor' || type === 'admin';
}

// Helper function to get display name for user's role
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