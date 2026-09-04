import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import { Reservation } from '../models/Reservation.js';
import {
  generateTransactionRef,
  computeBill,
  createInvoice,
} from '../services/payment.service.js';
import { validateRedemption, redeemPoints, earnPoints } from '../services/loyalty.service.js';
import { notify } from '../services/notification.service.js';
import {
  PAYMENT_STATUS,
  ORDER_STATUS,
  NOTIFICATION_TYPE,
} from '../config/constants.js';

/**
 * F16 Digital Payment (virtual bKash/Nagad) + F17 Invoice + F20 loyalty earn/redeem.
 * POST /api/payments  { order, method, redeemPoints?, simulate? }
 * `simulate` = 'success' | 'fail' controls the demo gateway outcome.
 */
export const createPayment = asyncHandler(async (req, res) => {
  const { order: orderId, method, redeemPoints: pointsToRedeem = 0, simulate = 'success' } =
    req.body;

  const order = await Order.findById(orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (String(order.customer) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only pay for your own order');
  }
  if (order.status === ORDER_STATUS.CANCELLED) {
    throw ApiError.badRequest('A cancelled order cannot be paid');
  }
  if (order.isPaid) throw ApiError.conflict('This order has already been paid');

  // Validate loyalty redemption (F20) before charging.
  let discount = 0;
  if (pointsToRedeem > 0) {
    discount = validateRedemption({
      user: req.user,
      points: pointsToRedeem,
      maxDiscount: order.subtotal,
    });
  }

  const bill = computeBill({ subtotal: order.subtotal, discount });

  // Simulated failure path — record a failed attempt, nothing else mutates.
  if (simulate === 'fail') {
    await Payment.create({
      order: order._id,
      customer: req.user._id,
      method,
      transactionRef: generateTransactionRef(method),
      amount: bill.total,
      pointsRedeemed: pointsToRedeem,
      discountApplied: bill.discount,
      status: PAYMENT_STATUS.FAILED,
    });
    throw ApiError.badRequest('Payment failed at the gateway (simulated). Please try again.');
  }

  // ----- Success path -----
  // Atomically claim the order for payment. Only ONE concurrent/duplicate
  // request can flip isPaid false -> true, so exactly one proceeds to charge,
  // invoice and loyalty. Crucially this does NOT touch fulfillment status.
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, isPaid: false, status: { $ne: ORDER_STATUS.CANCELLED } },
    { $set: { isPaid: true } },
    { new: true }
  );
  if (!claimed) {
    // Someone else already paid (or it was cancelled) between our checks.
    const fresh = await Order.findById(order._id);
    if (fresh && fresh.status === ORDER_STATUS.CANCELLED) {
      throw ApiError.badRequest('A cancelled order cannot be paid');
    }
    throw ApiError.conflict('This order has already been paid');
  }

  let payment;
  try {
    payment = await Payment.create({
      order: order._id,
      customer: req.user._id,
      method,
      transactionRef: generateTransactionRef(method),
      amount: bill.total,
      pointsRedeemed: pointsToRedeem,
      discountApplied: bill.discount,
      status: PAYMENT_STATUS.SUCCESS,
      paidAt: new Date(),
    });
  } catch (err) {
    // Partial failure — release the claim so the order stays consistent.
    await Order.updateOne({ _id: order._id }, { $set: { isPaid: false } });
    if (err && err.code === 11000) {
      throw ApiError.conflict('This order has already been paid');
    }
    throw err;
  }

  // Deduct redeemed points now that payment succeeded.
  if (pointsToRedeem > 0) {
    await redeemPoints({
      user: req.user,
      points: pointsToRedeem,
      payment,
      description: `Redeemed on order ${order._id}`,
    });
  }

  const reservation = order.reservation
    ? await Reservation.findById(order.reservation)
    : null;

  // Generate invoice (F17).
  const invoice = await createInvoice({
    order,
    payment,
    reservation,
    customer: req.user,
    bill,
  });

  // Earn loyalty points on the amount actually paid (F20).
  const { earned, balance } = await earnPoints({
    user: req.user,
    amount: bill.total,
    payment,
    description: `Earned on order ${order._id}`,
  });

  // Notifications (F11): payment success, invoice, loyalty update.
  await notify({
    user: req.user._id,
    type: NOTIFICATION_TYPE.PAYMENT_SUCCESS,
    title: 'Payment successful',
    message: `Your payment of ${bill.total} via ${method} was successful.`,
    link: `/invoices/${invoice._id}`,
  });
  await notify({
    user: req.user._id,
    type: NOTIFICATION_TYPE.INVOICE_GENERATED,
    title: 'Invoice ready',
    message: `Invoice ${invoice.invoiceNumber} is available to view and download.`,
    link: `/invoices/${invoice._id}`,
  });
  if (earned > 0) {
    await notify({
      user: req.user._id,
      type: NOTIFICATION_TYPE.LOYALTY_UPDATE,
      title: 'Loyalty points earned',
      message: `You earned ${earned} points. New balance: ${balance}.`,
      link: '/loyalty',
    });
  }

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Payment successful',
    data: { payment, invoice, loyalty: { earned, balance } },
  });
});

// GET /api/payments/my
export const myPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ customer: req.user._id })
    .populate('order', 'subtotal type')
    .sort({ createdAt: -1 });
  return sendSuccess(res, { message: 'Payments retrieved', data: payments });
});
