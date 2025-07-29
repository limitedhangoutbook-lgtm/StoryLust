// User role system for TurnPage
export type UserRole = "guest" | "registered" | "admin" | "mega-admin";

export interface UserPermissions {
  canRead: boolean;
  canReadPremium: boolean;
  canCreateStories: boolean;
  canManageUsers: boolean;
  canManageSystem: boolean;
}

// Role definitions
export const ROLE_PERMISSIONS: Record<UserRole, UserPermissions> = {
  guest: {
    canRead: true,
    canReadPremium: false,
    canCreateStories: false,
    canManageUsers: false,
    canManageSystem: false,
  },
  registered: {
    canRead: true,
    canReadPremium: true, // Can buy diamonds for premium content
    canCreateStories: false,
    canManageUsers: false,
    canManageSystem: false,
  },
  admin: {
    canRead: true,
    canReadPremium: true,
    canCreateStories: true, // Writers who can create stories
    canManageUsers: false,
    canManageSystem: false,
  },
  "mega-admin": {
    canRead: true,
    canReadPremium: true,
    canCreateStories: true,
    canManageUsers: true, // Can promote users to admin
    canManageSystem: true, // Full system access
  },
};

// Helper functions
export function getUserRole(user: any): UserRole {
  return user?.role || "guest";
}

export function getUserPermissions(user: any): UserPermissions {
  const role = getUserRole(user);
  return ROLE_PERMISSIONS[role];
}

export function hasPermission(user: any, permission: keyof UserPermissions): boolean {
  const permissions = getUserPermissions(user);
  return permissions[permission];
}

// Mega-admin designation (you)
export function isMegaAdmin(user: any): boolean {
  return user?.email === "evyatar.perel@gmail.com" || user?.role === "mega-admin";
}

// Admin writers (can create stories)
export function isAdmin(user: any): boolean {
  const role = getUserRole(user);
  return role === "admin" || role === "mega-admin";
}

// Registered users (can buy premium content)
export function isRegistered(user: any): boolean {
  const role = getUserRole(user);
  return role === "registered" || role === "admin" || role === "mega-admin";
}