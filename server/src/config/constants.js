/**
 * Central place for enums and role definitions used across models,
 * validators and role middleware. Import these instead of re-typing strings.
 */

export const ROLES = Object.freeze({
  CUSTOMER: 'customer',
  WAITER: 'waiter',
  CLEANER: 'cleaner',
  ADMIN: 'admin',
});

export const ROLE_VALUES = Object.values(ROLES);

export const TABLE_STATUS = Object.freeze({
  AVAILABLE: 'available',
  RESERVED: 'reserved',
  OCCUPIED: 'occupied',
  CLEANING_PENDING: 'cleaning_pending',
  CLEANING: 'cleaning',
  DISABLED: 'disabled',
});

export const SEATING_PREFERENCE = Object.freeze({
  INDOOR: 'indoor',
  OUTDOOR: 'outdoor',
  WINDOW: 'window',
  PRIVATE: 'private',
  ANY: 'any',
});

export const RESERVATION_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
});

export const ORDER_TYPE = Object.freeze({
  DINE_IN: 'dine_in',
  TAKEAWAY: 'takeaway',
});

// Allowed forward transitions for an order's lifecycle.
export const ORDER_STATUS = Object.freeze({
  PLACED: 'placed',
  PREPARING: 'preparing',
  READY: 'ready',
  SERVED: 'served',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
});

export const ORDER_STATUS_FLOW = Object.freeze({
  placed: ['preparing', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['served', 'cancelled'],
  served: ['completed'],
  completed: [],
  cancelled: [],
});

export const PAYMENT_METHOD = Object.freeze({
  BKASH: 'bkash',
  NAGAD: 'nagad',
});

export const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  REFUNDED: 'refunded',
});

// User-requested extension (not part of the formal F16 list): simulated refunds.
export const REFUND_STATUS = Object.freeze({
  PENDING: 'pending', // requested by customer, awaiting an authorized decision
  APPROVED: 'approved', // executed successfully (money simulated-returned)
  REJECTED: 'rejected', // declined by staff/admin
  FAILED: 'failed', // execution failed (e.g. injected gateway failure)
});

export const CLEANING_STATUS = Object.freeze({
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  DONE: 'done',
});

// A cleaning task is not only about tables — the floor, windows, restrooms and
// kitchen also need housekeeping. `table` is only meaningful for TABLE tasks.
export const CLEANING_AREA = Object.freeze({
  TABLE: 'table',
  FLOOR: 'floor',
  WINDOW: 'window',
  RESTROOM: 'restroom',
  KITCHEN: 'kitchen',
  GENERAL: 'general',
});

export const NOTIFICATION_TYPE = Object.freeze({
  RESERVATION_APPROVED: 'reservation_approved',
  RESERVATION_REJECTED: 'reservation_rejected',
  ORDER_STATUS: 'order_status',
  PAYMENT_SUCCESS: 'payment_success',
  INVOICE_GENERATED: 'invoice_generated',
  TABLE_READY: 'table_ready',
  CLEANING_COMPLETED: 'cleaning_completed',
  LOYALTY_UPDATE: 'loyalty_update',
  REFUND_REQUESTED: 'refund_requested',
  REFUND_PROCESSED: 'refund_processed',
});

export const LOYALTY_TX_TYPE = Object.freeze({
  EARN: 'earn',
  REDEEM: 'redeem',
  // Refund reversals (F20 refund extension): reverse points earned on the
  // refunded payment and restore points that were redeemed against it.
  REFUND_REVERSE: 'refund_reverse',
  REFUND_RESTORE: 'refund_restore',
});

export const values = (obj) => Object.values(obj);
