import { Reservation } from '../models/Reservation.js';
import { RestaurantTable } from '../models/RestaurantTable.js';
import { BookingSlot } from '../models/BookingSlot.js';
import { ApiError } from '../utils/ApiError.js';
import { parseStrictDateTime } from '../utils/datetime.js';
import { RESERVATION_STATUS, TABLE_STATUS, SEATING_PREFERENCE } from '../config/constants.js';

// Default dining duration (minutes) used to derive a reservation's end time.
export const DEFAULT_DURATION_MIN = 90;

// Booking grid granularity. Reservation start times are aligned to this (see
// the validator) so a window decomposes into an exact set of grid slots.
export const SLOT_MINUTES = 30;

// Statuses that still hold a table slot (block other bookings).
const BLOCKING_STATUSES = [RESERVATION_STATUS.PENDING, RESERVATION_STATUS.APPROVED];

/**
 * Combine a calendar day (YYYY-MM-DD) and time (HH:mm) into a Date, and derive
 * the end instant from a duration. Rejects malformed or impossible dates
 * (e.g. 2026-02-31) by strict round-trip parsing.
 */
export function buildTimeWindow(date, startTime, durationMin = DEFAULT_DURATION_MIN) {
  let start;
  try {
    start = parseStrictDateTime(date, startTime);
  } catch {
    throw ApiError.badRequest('Invalid reservation date or time');
  }
  const end = new Date(start.getTime() + durationMin * 60 * 1000);
  const pad = (n) => String(n).padStart(2, '0');
  const endTime = `${pad(end.getHours())}:${pad(end.getMinutes())}`;
  return { startAt: start, endAt: end, endTime };
}

/** Floor a Date down to the start of its 30-minute grid slot. */
function floorToSlot(date) {
  const d = new Date(date);
  d.setSeconds(0, 0);
  d.setMinutes(d.getMinutes() - (d.getMinutes() % SLOT_MINUTES));
  return d;
}

/**
 * The set of grid-slot boundary instants that a window [startAt, endAt)
 * occupies. Overlapping windows always share at least one boundary, so
 * inserting these into the unique BookingSlot index detects every overlap.
 */
export function slotsForWindow(startAt, endAt) {
  const slots = [];
  let cur = floorToSlot(startAt);
  while (cur.getTime() < endAt.getTime()) {
    slots.push(new Date(cur));
    cur = new Date(cur.getTime() + SLOT_MINUTES * 60 * 1000);
  }
  return slots;
}

/**
 * Atomically reserve every grid slot the window needs for a table.
 *
 * Relies on the unique `{ table, slotAt }` index: the first writer to a slot
 * wins, a competing writer gets a duplicate-key error. On any failure the
 * partially-acquired slots are rolled back so nothing leaks.
 *
 * @returns the acquired slot boundaries.
 * @throws ApiError.conflict(409) when the window overlaps an existing booking.
 */
export async function acquireSlots({ tableId, reservationId, startAt, endAt }) {
  const slots = slotsForWindow(startAt, endAt);
  const acquired = [];
  try {
    for (const slotAt of slots) {
      const doc = await BookingSlot.create({
        table: tableId,
        slotAt,
        reservation: reservationId,
      });
      acquired.push(doc._id);
    }
  } catch (err) {
    if (acquired.length) await BookingSlot.deleteMany({ _id: { $in: acquired } });
    if (err && err.code === 11000) {
      throw ApiError.conflict('This table is already booked for the selected time');
    }
    throw err;
  }
  return slots;
}

/** Release all slots held by a reservation (on reject/cancel/complete). */
export async function releaseSlots(reservationId) {
  await BookingSlot.deleteMany({ reservation: reservationId });
}

/**
 * Find reservations on a table that overlap [startAt, endAt).
 * Two intervals overlap when existing.startAt < new.endAt AND existing.endAt > new.startAt.
 */
export function findOverlapping({ tableId, startAt, endAt, excludeId = null }) {
  const query = {
    table: tableId,
    status: { $in: BLOCKING_STATUSES },
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
  };
  if (excludeId) query._id = { $ne: excludeId };
  return Reservation.find(query);
}

/**
 * F08 — real-time available tables for a requested window.
 * A table is available when it is active, not disabled, meets capacity/preference,
 * and has no blocking reservation overlapping the window.
 */
export async function findAvailableTables({ date, startTime, guests, seatingPreference }) {
  const { startAt, endAt } = buildTimeWindow(date, startTime);

  const tableFilter = {
    isActive: true,
    status: { $ne: TABLE_STATUS.DISABLED },
    capacity: { $gte: guests || 1 },
  };
  if (seatingPreference && seatingPreference !== SEATING_PREFERENCE.ANY) {
    tableFilter.seatingPreference = seatingPreference;
  }

  const candidates = await RestaurantTable.find(tableFilter).sort({ capacity: 1, tableNumber: 1 });

  // Exclude any candidate with an overlapping reservation.
  const busy = await Reservation.find({
    table: { $in: candidates.map((t) => t._id) },
    status: { $in: BLOCKING_STATUSES },
    startAt: { $lt: endAt },
    endAt: { $gt: startAt },
  }).distinct('table');

  const busyIds = new Set(busy.map((id) => String(id)));
  return {
    window: { startAt, endAt },
    tables: candidates.filter((t) => !busyIds.has(String(t._id))),
  };
}

/**
 * Recalculate a table's *current operational* status from live facts, keeping
 * scheduled (future) reservation availability out of it. Future overlaps are
 * handled by slot locks / findAvailableTables, never by the table's status.
 *
 * Precedence: disabled > active cleaning task > available.
 */
export async function recalcTableStatus(tableId) {
  const { CleaningTask } = await import('../models/CleaningTask.js');
  const { CLEANING_STATUS } = await import('../config/constants.js');

  const table = await RestaurantTable.findById(tableId);
  if (!table) return null;

  if (!table.isActive) {
    if (table.status !== TABLE_STATUS.DISABLED) {
      table.status = TABLE_STATUS.DISABLED;
      await table.save();
    }
    return table;
  }

  const activeCleaning = await CleaningTask.findOne({
    table: tableId,
    status: { $in: [CLEANING_STATUS.PENDING, CLEANING_STATUS.IN_PROGRESS] },
  });

  let next = TABLE_STATUS.AVAILABLE;
  if (activeCleaning) {
    next =
      activeCleaning.status === CLEANING_STATUS.IN_PROGRESS
        ? TABLE_STATUS.CLEANING
        : TABLE_STATUS.CLEANING_PENDING;
  }

  if (table.status !== next) {
    table.status = next;
    await table.save();
  }
  return table;
}
