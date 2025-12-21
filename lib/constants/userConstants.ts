// User Roles
export const USER_ROLES = {
  ATTENDEE: 'attendee',
  ORGANIZER: 'organizer',
  ADMIN: 'admin',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// User Status
export const USER_STATUS = {
  VERIFIED: 'verified',
  UNVERIFIED: 'unverified',
} as const;

export type UserStatus = typeof USER_STATUS[keyof typeof USER_STATUS];