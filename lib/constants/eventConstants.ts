// Event Categories
export const EVENT_CATEGORIES = {
  MUSIC: 'music',
  SPORTS: 'sports',
  CONFERENCE: 'conference',
  WORKSHOP: 'workshop',
  FESTIVAL: 'festival',
  THEATER: 'theater',
  COMEDY: 'comedy',
  EXHIBITION: 'exhibition',
  EDUCATION: 'education',
  NETWORKING: 'networking',
} as const;

export type EventCategory = typeof EVENT_CATEGORIES[keyof typeof EVENT_CATEGORIES];

// Event Status
export const EVENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
} as const;

export type EventStatus = typeof EVENT_STATUS[keyof typeof EVENT_STATUS];

// Event Types
export const EVENT_TYPES = {
  IN_PERSON: 'in_person',
  ONLINE: 'online',
  HYBRID: 'hybrid',
} as const;

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES];