import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { Refund } from '../models/Refund.js';
import { User } from '../models/User.js';
import { reverseLoyaltyForPayment } from '../services/loyalty.service.js';
import { notify } from '../services/notification.service.js';
import {
  PAYMENT_STATUS,
  REFUND_STATUS,
  NOTIFICATION_TYPE,
} from '../config/constants.js';

/**
 * F16 refund extension (user-requested; NOT part of the formal F16 list).
 *
 * Policy: a customer may request a full simulated refund for their own
 * successfully-paid order. An admin (only) approves or rejects it. Approval is
 * atomic and idempotent — the single source of truth for "did this actually
 * happen" is flipping the Payment SUCCESS -> REFUNDED, which can only occur
 * once; whoever wins that flip performs the loyalty reversal and order update
 * exactly once. The original invoice/charge is preserved immutably; refund
 * metadata lives on the Refund document.
 */

function simulatedRefundRef() {
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `REFUND-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

// ---- Customer: request a refund ----
// POST /api/refunds  { order, reason?, idempotencyKey? }
export const requestRefund = asyncHandler(async (req, res) => {
  const { order: orderId, reason = '', idempotencyKey } = req.body;

  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (String(order.customer) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only request a refund for your own order');
  }
  if (!order.isPaid) throw ApiError.badRequest('Only a paid order can be refunded');
  if (order.isRefunded) throw ApiError.conflict('This order has already been refunded');

  const payment = await Payment.findOne({ order: order._id, status: PAYMENT_STATUS.SUCCESS });
  if (!payment) throw ApiError.badRequest('No successful payment found for this order');

  // Idempotent replay: the same client key always returns the original request.
  if (idempotencyKey) {
    const existing = await Refund.findOne({ idempotencyKey });
    if (existing) {
      return sendSuccess(res, { message: 'Refund request already recorded', data: existing });
    }
  }

  const key = idempotencyKey || `refund-${order._id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  try {
    const refund = await Refund.create({
      order: order._id,
      payment: payment._id,
      customer: req.user._id,
      amount: payment.amount,
      reason: (reason || '').trim(),
      idempotencyKey: key,
      requestedBy: req.user._id,
      status: REFUND_STATUS.PENDING,
    });

    return sendSuccess(res, {
      statusCode: 201,
      message: 'Refund requested. An administrator will review it.',
      data: refund,
    });
  } catch (err) {
    // The payment partial-unique index (one active refund per payment) or the
    // idempotency key collided: a concurrent/duplicate request already created
    // it. Return that single record instead of a second refund.
    if (err && err.code === 11000) {
      const existing =
        (await Refund.findOne({ idempotencyKey: key })) ||
        (await Refund.findOne({
          payment: payment._id,
          status: { $in: [REFUND_STATUS.PENDING, REFUND_STATUS.APPROVED] },
        }));
      if (existing) {
        return sendSuccess(res, { message: 'Refund request already recorded', data: existing });
      }
      throw ApiError.conflict('A refund request already exists for this order');
    }
    throw err;
  }
});

// ---- Admin: approve (execute) a refund ----
// POST /api/refunds/:id/process  { simulate?: 'success'|'fail' }
export const processRefund = asyncHandler(async (req, res) => {
  const { simulate = 'success' } = req.body;
  const refund = await Refund.findById(req.params.id);
  if (!refund) throw ApiError.notFound('Refund not found');

  if (refund.status === REFUND_STATUS.APPROVED) {
    // Already executed — idempotent success.
    return sendSuccess(res, { message: 'Refund already processed', data: refund });
  }
  if (refund.status !== REFUND_STATUS.PENDING) {
    throw ApiError.badRequest(`Only a pending refund can be processed (current: ${refund.status})`);
  }

  // Simulated gateway failure: mark the refund failed, mutate nothing else.
  if (simulate === 'fail') {
    const failed = await Refund.findOneAndUpdate(
      { _id: refund._id, status: REFUND_STATUS.PENDING },
      { status: REFUND_STATUS.FAILED, processedBy: req.user._id, processedAt: new Date() },
      { new: true }
    );
    throw ApiError.badRequest('Refund failed at the gateway (simulated). No money was returned.');
  }

  // Atomically claim the refund so only one approver executes side effects.
  const claimed = await Refund.findOneAndUpdate(
    { _id: refund._id, status: REFUND_STATUS.PENDING },
    {
      status: REFUND_STATUS.APPROVED,
      processedBy: req.user._id,
      processedAt: new Date(),
      simulatedRef: simulatedRefundRef(),
    },
    { new: true }
  );
  if (!claimed) {
    const fresh = await Refund.findById(refund._id);
    return sendSuccess(res, { message: 'Refund already processed', data: fresh });
  }

  // The single gate for the money-side effects: flip the payment SUCCESS ->
  // REFUNDED. Exactly one caller wins this, so the loyalty reversal and order
  // update happen exactly once even under concurrent approvals.
  const claimedPayment = await Payment.findOneAndUpdate(
    { _id: claimed.payment, status: PAYMENT_STATUS.SUCCESS },
    { status: PAYMENT_STATUS.REFUNDED },
    { new: true }
  );

  if (claimedPayment) {
    await Order.updateOne(
      { _id: claimed.order },
      { isRefunded: true, refundedAt: new Date() }
    );

    const customer = await User.findById(claimed.customer);
    if (customer) {
      const { reversed, restored } = await reverseLoyaltyForPayment({
        user: customer,
        payment: claimedPayment,
        description: `Refund for order ${claimed.order}`,
      });
      claimed.pointsReversed = reversed;
      claimed.pointsRestored = restored;
      await claimed.save();
    }

    await notify({
      user: claimed.customer,
      type: NOTIFICATION_TYPE.REFUND_PROCESSED,
      title: 'Refund processed',
      message: `Your refund of ${claimed.amount} was processed (ref ${claimed.simulatedRef}).`,
      link: '/orders',
    });
  }

  return sendSuccess(res, { message: 'Refund processed', data: claimed });
});

// ---- Admin: reject a refund ----
// POST /api/refunds/:id/reject  { note? }
export const rejectRefund = asyncHandler(async (req, res) => {
  const refund = await Refund.findById(req.params.id);
  if (!refund) throw ApiError.notFound('Refund not found');
  if (refund.status !== REFUND_STATUS.PENDING) {
    throw ApiError.badRequest(`Only a pending refund can be rejected (current: ${refund.status})`);
  }

  const rejected = await Refund.findOneAndUpdate(
    { _id: refund._id, status: REFUND_STATUS.PENDING },
    {
      status: REFUND_STATUS.REJECTED,
      processedBy: req.user._id,
      processedAt: new Date(),
      decisionNote: (req.body.note || '').trim(),
    },
    { new: true }
  );
  if (!rejected) {
    const fresh = await Refund.findById(refund._id);
    return sendSuccess(res, { message: 'Refund already decided', data: fresh });
  }

  await notify({
    user: rejected.customer,
    type: NOTIFICATION_TYPE.REFUND_PROCESSED,
    title: 'Refund declined',
    message: `Your refund request was declined.${rejected.decisionNote ? ` Reason: ${rejected.decisionNote}` : ''}`,
    link: '/orders',
  });

  return sendSuccess(res, { message: 'Refund rejected', data: rejected });
});

// ---- Customer: my refunds ----
// GET /api/refunds/my
export const myRefunds = asyncHandler(async (req, res) => {
  const refunds = await Refund.find({ customer: req.user._id })
    .populate('order', 'subtotal type')
    .sort({ createdAt: -1 });
  return sendSuccess(res, { message: 'Refunds retrieved', data: refunds });
});

// ---- Admin: all refunds (optionally filtered by status) ----
// GET /api/refunds?status=
export const listRefunds = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  const refunds = await Refund.find(filter)
    .populate('order', 'subtotal type')
    .populate('customer', 'name email')
    .sort({ createdAt: -1 });
  return sendSuccess(res, { message: 'Refunds retrieved', data: refunds });
});
