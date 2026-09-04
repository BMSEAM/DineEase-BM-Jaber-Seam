import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { Order } from '../models/Order.js';
import { Reservation } from '../models/Reservation.js';
import { buildOrderItems, assertTransition } from '../services/order.service.js';
import { notify } from '../services/notification.service.js';
import { ORDER_TYPE, ORDER_STATUS, NOTIFICATION_TYPE, ROLES } from '../config/constants.js';

/**
 * F05 Pre-order Food — create an order (dine-in pre-order tied to a reservation,
 * or standalone takeaway).
 * POST /api/orders
 */
export const createOrder = asyncHandler(async (req, res) => {
  const { items, type, reservation: reservationId } = req.body;

  // Resolve the order type consistently with the supported combinations:
  // - standalone (no reservation)  -> takeaway only. A tableless standalone
  //   dine-in record is meaningless and is rejected.
  // - reservation-linked           -> dine-in by default; takeaway allowed.
  let orderType;
  if (reservationId) {
    orderType = type === ORDER_TYPE.TAKEAWAY ? ORDER_TYPE.TAKEAWAY : ORDER_TYPE.DINE_IN;
  } else {
    if (type === ORDER_TYPE.DINE_IN) {
      throw ApiError.badRequest(
        'Dine-in orders require a reserved table. Reserve a table, or place a takeaway order.'
      );
    }
    orderType = ORDER_TYPE.TAKEAWAY;
  }

  if (reservationId) {
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) throw ApiError.notFound('Reservation not found');
    if (String(reservation.customer) !== String(req.user._id)) {
      throw ApiError.forbidden('You can only pre-order for your own reservation');
    }
    if (reservation.order) {
      throw ApiError.conflict('This reservation already has an order');
    }
  }

  // Re-validate item availability and prices against the live menu.
  const { items: orderItems, subtotal } = await buildOrderItems(items);

  // Attach the order to the reservation atomically to avoid duplicate/orphan
  // orders under concurrent attach attempts: only succeeds while the
  // reservation has no order yet.
  const order = await Order.create({
    customer: req.user._id,
    reservation: reservationId || undefined,
    type: orderType,
    items: orderItems,
    subtotal,
  });

  if (reservationId) {
    const linked = await Reservation.findOneAndUpdate(
      { _id: reservationId, order: { $exists: false } },
      { order: order._id },
      { new: true }
    );
    if (!linked) {
      // Lost the race: another order was attached first. Discard ours.
      await Order.deleteOne({ _id: order._id });
      throw ApiError.conflict('This reservation already has an order');
    }
  }

  return sendSuccess(res, { statusCode: 201, message: 'Order placed', data: order });
});

// GET /api/orders/my  — customer's orders (F10 tracking)
export const myOrders = asyncHandler(async (req, res) => {
  const filter = { customer: req.user._id };
  if (req.query.status) filter.status = req.query.status;
  const orders = await Order.find(filter)
    .populate('reservation', 'date startTime table')
    .sort({ createdAt: -1 });
  return sendSuccess(res, { message: 'Orders retrieved', data: orders });
});

// GET /api/orders/:id  — owner or staff
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('reservation', 'date startTime');
  if (!order) throw ApiError.notFound('Order not found');
  const isOwner = String(order.customer) === String(req.user._id);
  const isStaff = [ROLES.ADMIN, ROLES.WAITER].includes(req.user.role);
  if (!isOwner && !isStaff) throw ApiError.forbidden('You cannot view this order');
  return sendSuccess(res, { message: 'Order retrieved', data: order });
});

/**
 * F10 Order Status Tracking — staff view of active orders (kitchen queue).
 * GET /api/orders?status=
 */
export const listOrders = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const orders = await Order.find(filter)
    .populate('customer', 'name')
    .populate('reservation', 'date startTime')
    .sort({ createdAt: 1 });
  return sendSuccess(res, { message: 'Orders retrieved', data: orders });
});

/**
 * F10 — advance order status with a validated transition. Notifies the customer.
 * PATCH /api/orders/:id/status  { status }
 */
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) throw ApiError.notFound('Order not found');

  // A paid order cannot be cancelled through the kitchen queue. Money is only
  // reversed through the dedicated refund flow (customer requests, admin
  // approves), which records an auditable Refund and reverses loyalty.
  if (status === ORDER_STATUS.CANCELLED && order.isPaid) {
    throw ApiError.badRequest('A paid order cannot be cancelled here. Use the refund flow instead.');
  }

  assertTransition(order.status, status); // throws 400 on illegal move
  order.status = status;
  await order.save();

  await notify({
    user: order.customer,
    type: NOTIFICATION_TYPE.ORDER_STATUS,
    title: 'Order update',
    message: `Your order is now "${status}".`,
    link: `/orders`,
  });

  return sendSuccess(res, { message: `Order marked ${status}`, data: order });
});
