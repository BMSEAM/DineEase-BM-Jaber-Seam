// Mirror of the backend role/status enums used for UI logic.
export const ROLES = {
  CUSTOMER: 'customer',
  WAITER: 'waiter',
  CLEANER: 'cleaner',
  ADMIN: 'admin',
};

export const SEATING = ['any', 'indoor', 'outdoor', 'window', 'private'];

export const RESERVATION_STATUSES = [
  'pending',
  'approved',
  'rejected',
  'cancelled',
  'completed',
];

export const ORDER_STATUSES = ['placed', 'preparing', 'ready', 'served', 'completed', 'cancelled'];

// Legal next statuses for the staff order queue (mirror of backend flow).
export const ORDER_NEXT = {
  placed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['served', 'cancelled'],
  served: ['completed'],
  completed: [],
  cancelled: [],
};
