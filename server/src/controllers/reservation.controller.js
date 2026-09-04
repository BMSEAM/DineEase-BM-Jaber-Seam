import mongoose from 'mongoose';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { Reservation } from '../models/Reservation.js';
import { RestaurantTable } from '../models/RestaurantTable.js';
import { Order } from '../models/Order.js';
import {
  buildTimeWindow,
  findOverlapping,
  acquireSlots,
  releaseSlots,
} from '../services/reservation.service.js';
import { buildOrderItems } from '../services/order.service.js';
import { notify } from '../services/notification.service.js';
import {
  RESERVATION_STATUS,
  TABLE_STATUS,
  ORDER_TYPE,
  ORDER_STATUS,
  NOTIFICATION_TYPE,
  ROLES,
  SEATING_PREFERENCE,
} from '../config/constants.js';

/**
 * F03 Table Reservation — create a reservation, preventing invalid/overlapping
 * bookings. Optionally attaches a pre-order (F05).
 *
 * Correctness guarantees:
 * - Concurrency-safe against double-booking via database slot locks (no
 *   find-before-create race, no in-process mutex).
 * - All-or-nothing: everything is validated before any write, and if the
 *   pre-order fails the reservation, order and slot locks are all rolled back.
 * POST /api/reservations
 */
export const createReservation = asyncHandler(async (req, res) => {
  const { table: tableId, date, startTime, guests, seatingPreference, notes, items, orderType } =
    req.body;

  // ---- Validate everything BEFORE mutating anything ----
  const table = await RestaurantTable.findById(tableId);
  if (!table) throw ApiError.notFound('Selected table not found');
  if (!table.isActive || table.status === TABLE_STATUS.DISABLED) {
    throw ApiError.badRequest('Selected table is not available for booking');
  }
  if (guests > table.capacity) {
    throw ApiError.badRequest(`Table ${table.tableNumber} seats up to ${table.capacity} guests`);
  }

  // Revalidate the seating preference against the chosen table (never trust the
  // client). 'any' is always acceptable.
  const requestedPref = seatingPreference || SEATING_PREFERENCE.ANY;
  if (
    requestedPref !== SEATING_PREFERENCE.ANY &&
    table.seatingPreference !== SEATING_PREFERENCE.ANY &&
    requestedPref !== table.seatingPreference
  ) {
    throw ApiError.badRequest(
      `Table ${table.tableNumber} is ${table.seatingPreference} seating, not ${requestedPref}`
    );
  }

  const { startAt, endAt, endTime } = buildTimeWindow(date, startTime);
  if (startAt < new Date()) throw ApiError.badRequest('Cannot reserve a time in the past');

  // Validate the optional pre-order up front so an invalid item never leaves an
  // orphan reservation. Nothing is written yet.
  let preorder = null;
  if (Array.isArray(items) && items.length > 0) {
    const { items: orderItems, subtotal } = await buildOrderItems(items);
    preorder = { orderItems, subtotal };
  }

  // Deterministic overlap guard. The unique BookingSlot index below is the
  // authoritative concurrency defense, but it is only effective once the index
  // has finished building. This explicit check makes sequential overlaps fail
  // reliably regardless of index-build timing, and returns a clear 409.
  const existingOverlap = await findOverlapping({ tableId, startAt, endAt });
  if (existingOverlap.length > 0) {
    throw ApiError.conflict('This table is already booked for the selected time');
  }

  // Pre-allocate the reservation id so slot locks and the reservation agree.
  const reservationId = new mongoose.Types.ObjectId();

  // ---- Acquire the slot locks (atomic conflict detection) ----
  await acquireSlots({ tableId, reservationId, startAt, endAt });

  // ---- From here on, compensate on any failure ----
  try {
    const reservation = await Reservation.create({
      _id: reservationId,
      customer: req.user._id,
      table: tableId,
      date,
      startTime,
      endTime,
      startAt,
      endAt,
      guests,
      seatingPreference: requestedPref,
      notes,
    });

    if (preorder) {
      const order = await Order.create({
        customer: req.user._id,
        reservation: reservation._id,
        // A reservation-linked pre-order is dine-in unless takeaway is explicitly
        // requested (supported per the audited F05 contract).
        type: orderType === ORDER_TYPE.TAKEAWAY ? ORDER_TYPE.TAKEAWAY : ORDER_TYPE.DINE_IN,
        items: preorder.orderItems,
        subtotal: preorder.subtotal,
      });
      reservation.order = order._id;
      await reservation.save();
    }

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Reservation created and pending approval',
      data: await reservation.populate('table', 'tableNumber capacity seatingPreference'),
    });
  } catch (err) {
    // Roll back so a failed pre-order leaves no reservation, order or slot.
    await Order.deleteMany({ reservation: reservationId });
    await Reservation.deleteOne({ _id: reservationId });
    await releaseSlots(reservationId);
    throw err;
  }
});

/**
 * F04 Reservation History — the current customer's reservations, filterable by status.
 * GET /api/reservations/my?status=
 */
export const myReservations = asyncHandler(async (req, res) => {
  const filter = { customer: req.user._id };
  if (req.query.status) filter.status = req.query.status;

  const reservations = await Reservation.find(filter)
    .populate('table', 'tableNumber capacity seatingPreference')
    .populate({ path: 'order', select: 'items subtotal status isPaid type' })
    .sort({ startAt: -1 });

  return sendSuccess(res, { message: 'Reservation history retrieved', data: reservations });
});

// GET /api/reservations/:id  — owner or staff/admin
export const getReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id)
    .populate('table')
    .populate('customer', 'name email phone')
    .populate('order');
  if (!reservation) throw ApiError.notFound('Reservation not found');

  const isOwner = String(reservation.customer._id) === String(req.user._id);
  const isStaff = [ROLES.ADMIN, ROLES.WAITER].includes(req.user.role);
  if (!isOwner && !isStaff) throw ApiError.forbidden('You cannot view this reservation');

  return sendSuccess(res, { message: 'Reservation retrieved', data: reservation });
});

/**
 * F09 Reservation Approval — staff/admin list of pending reservations.
 * GET /api/reservations?status=pending
 */
export const listReservations = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  if (req.query.date) filter.date = req.query.date;

  const reservations = await Reservation.find(filter)
    .populate('table', 'tableNumber capacity')
    .populate('customer', 'name email phone')
    .populate({ path: 'order', select: 'items subtotal status isPaid type' })
    .sort({ startAt: 1 });

  return sendSuccess(res, { message: 'Reservations retrieved', data: reservations });
});

// PATCH /api/reservations/:id/approve  (F09, staff/admin)
export const approveReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) throw ApiError.notFound('Reservation not found');
  if (reservation.status !== RESERVATION_STATUS.PENDING) {
    throw ApiError.badRequest(`Only pending reservations can be approved (current: ${reservation.status})`);
  }

  // Re-check for conflicts approved in the meantime.
  const clashes = await findOverlapping({
    tableId: reservation.table,
    startAt: reservation.startAt,
    endAt: reservation.endAt,
    excludeId: reservation._id,
  });
  if (clashes.some((r) => r.status === RESERVATION_STATUS.APPROVED)) {
    throw ApiError.conflict('Another reservation for this slot has already been approved');
  }

  reservation.status = RESERVATION_STATUS.APPROVED;
  reservation.decidedBy = req.user._id;
  await reservation.save();

  // NOTE: approving a *future* reservation must NOT change the table's current
  // operational status. Future availability is governed by slot locks; the
  // table only becomes occupied/cleaning at dining time.

  await notify({
    user: reservation.customer,
    type: NOTIFICATION_TYPE.RESERVATION_APPROVED,
    title: 'Reservation approved',
    message: `Your reservation for ${reservation.date} at ${reservation.startTime} was approved.`,
    link: `/reservations`,
  });

  return sendSuccess(res, { message: 'Reservation approved', data: reservation });
});

// PATCH /api/reservations/:id/reject  (F09, staff/admin)
export const rejectReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id).populate('order');
  if (!reservation) throw ApiError.notFound('Reservation not found');
  if (reservation.status !== RESERVATION_STATUS.PENDING) {
    throw ApiError.badRequest(`Only pending reservations can be rejected (current: ${reservation.status})`);
  }
  const reason = (req.body.reason || '').trim();
  if (!reason) throw ApiError.badRequest('A rejection reason is required');

  reservation.status = RESERVATION_STATUS.REJECTED;
  reservation.decidedBy = req.user._id;
  reservation.decisionReason = reason;
  await reservation.save();

  // A rejected reservation must not leave a live pre-order in the kitchen queue.
  // A pending reservation's pre-order is always fresh (placed, unpaid), so it is
  // safe to auto-cancel.
  if (reservation.order) {
    await cancelPreorderIfDiscardable(reservation.order);
  }
  await releaseSlots(reservation._id);

  await notify({
    user: reservation.customer,
    type: NOTIFICATION_TYPE.RESERVATION_REJECTED,
    title: 'Reservation rejected',
    message: `Your reservation for ${reservation.date} at ${reservation.startTime} was rejected. Reason: ${reason}`,
    link: `/reservations`,
  });

  return sendSuccess(res, { message: 'Reservation rejected', data: reservation });
});

// PATCH /api/reservations/:id/cancel  (owner) — cancel own pending/approved booking
export const cancelReservation = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id).populate('order');
  if (!reservation) throw ApiError.notFound('Reservation not found');
  if (String(reservation.customer) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only cancel your own reservations');
  }
  if (![RESERVATION_STATUS.PENDING, RESERVATION_STATUS.APPROVED].includes(reservation.status)) {
    throw ApiError.badRequest('Only pending or approved reservations can be cancelled');
  }

  // Lifecycle policy: do not silently discard an order that is paid or already
  // being prepared. Require explicit staff resolution instead.
  const order = reservation.order;
  if (order) {
    const active = [ORDER_STATUS.PREPARING, ORDER_STATUS.READY, ORDER_STATUS.SERVED].includes(
      order.status
    );
    if (order.isPaid || active) {
      throw ApiError.badRequest(
        'This reservation has a paid or in-progress order. Please contact staff to resolve it before cancelling.'
      );
    }
  }

  reservation.status = RESERVATION_STATUS.CANCELLED;
  await reservation.save();

  if (order) await cancelPreorderIfDiscardable(order);
  await releaseSlots(reservation._id);

  return sendSuccess(res, { message: 'Reservation cancelled', data: reservation });
});

/**
 * Cancel a pre-order that is safe to discard (unpaid and still `placed`).
 * Accepts an Order document or an id.
 */
async function cancelPreorderIfDiscardable(orderOrId) {
  const order =
    orderOrId && orderOrId._id ? orderOrId : await Order.findById(orderOrId);
  if (!order) return;
  if (!order.isPaid && order.status === ORDER_STATUS.PLACED) {
    order.status = ORDER_STATUS.CANCELLED;
    await order.save();
  }
}
