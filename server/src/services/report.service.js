import { Payment } from '../models/Payment.js';
import { Order } from '../models/Order.js';
import { Reservation } from '../models/Reservation.js';
import { PAYMENT_STATUS } from '../config/constants.js';

/** Resolve a named period ('daily'|'weekly'|'monthly') to a [from, to) range. */
export function resolvePeriod(period = 'daily') {
  const to = new Date();
  const from = new Date();
  if (period === 'weekly') from.setDate(from.getDate() - 7);
  else if (period === 'monthly') from.setMonth(from.getMonth() - 1);
  else from.setHours(0, 0, 0, 0); // daily = since midnight
  return { from, to };
}

/**
 * F19 Sales & Reservation Reports — revenue, counts, most-ordered foods,
 * peak hours and payment-method usage within a period.
 */
export async function buildReport(period) {
  const { from, to } = resolvePeriod(period);
  const paidMatch = { status: PAYMENT_STATUS.SUCCESS, paidAt: { $gte: from, $lte: to } };

  const [revenueAgg, methodAgg, orderCount, reservationCount, topFoods, peakHours] =
    await Promise.all([
      Payment.aggregate([
        { $match: paidMatch },
        { $group: { _id: null, revenue: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: paidMatch },
        { $group: { _id: '$method', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Order.countDocuments({ createdAt: { $gte: from, $lte: to } }),
      Reservation.countDocuments({ createdAt: { $gte: from, $lte: to } }),
      Order.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.name',
            quantity: { $sum: '$items.quantity' },
            revenue: { $sum: '$items.lineTotal' },
          },
        },
        { $sort: { quantity: -1 } },
        { $limit: 5 },
      ]),
      Reservation.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        { $group: { _id: { $substr: ['$startTime', 0, 2] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]),
    ]);

  const revenue = revenueAgg[0]?.revenue || 0;
  const paymentCount = revenueAgg[0]?.count || 0;

  return {
    period,
    range: { from, to },
    revenue: Number(revenue.toFixed(2)),
    paymentCount,
    orderCount,
    reservationCount,
    mostOrderedFoods: topFoods.map((f) => ({
      name: f._id,
      quantity: f.quantity,
      revenue: Number(f.revenue.toFixed(2)),
    })),
    peakHours: peakHours.map((h) => ({ hour: `${h._id}:00`, reservations: h.count })),
    paymentMethods: methodAgg.map((m) => ({
      method: m._id,
      total: Number(m.total.toFixed(2)),
      count: m.count,
    })),
  };
}
