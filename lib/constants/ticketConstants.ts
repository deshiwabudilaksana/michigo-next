// Ticket Status
export const TICKET_STATUS = {
  RESERVED: 'reserved',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  USED: 'used',
} as const;

export type TicketStatus = typeof TICKET_STATUS[keyof typeof TICKET_STATUS];

// Ticket Types
export const TICKET_TYPES = {
  GENERAL: 'general',
  VIP: 'vip',
  PREMIUM: 'premium',
  STUDENT: 'student',
  EARLY_BIRD: 'early_bird',
} as const;

export type TicketType = typeof TICKET_TYPES[keyof typeof TICKET_TYPES];

// Order Status
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
  REFUNDED: 'refunded',
} as const;

export type OrderStatus = typeof ORDER_STATUS[keyof typeof ORDER_STATUS];

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
} as const;

export type PaymentStatus = typeof PAYMENT_STATUS[keyof typeof PAYMENT_STATUS];

// Payment Methods
export const PAYMENT_METHODS = {
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  PAYPAL: 'paypal',
  BANK_TRANSFER: 'bank_transfer',
  CASH: 'cash',
} as const;

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];