import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { User } from '../models/User.js';
import { Reservation } from '../models/Reservation.js';
import { RestaurantTable } from '../models/RestaurantTable.js';
import { Order } from '../models/Order.js';
import { Payment } from '../models/Payment.js';
import {
  RESERVATION_STATUS,
  TABLE_STATUS,
  ORDER_STATUS,
  PAYMENT_STATUS,
  ROLES,
} from '../config/constants.js';

/**
 * F18 Admin Dashboard — a single aggregated snapshot of the restaurant.
 * GET /api/admin/dashboard
 */
export const getDashboard = asyncHandler(async (req, res) => {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    todaysReservations,
    pendingReservations,
    approvedReservations,
    occupiedTables,
    availableTables,
    cleaningTables,
    ordersInProgress,
    customerCount,
    staffCount,
    revenueAgg,
  ] = await Promise.all([
    Reservation.countDocuments({ date: today }),
    Reservation.countDocuments({ status: RESERVATION_STATUS.PENDING }),
    Reservation.countDocuments({ status: RESERVATION_STATUS.APPROVED }),
    RestaurantTable.countDocuments({ status: TABLE_STATUS.OCCUPIED }),
    RestaurantTable.countDocuments({ status: TABLE_STATUS.AVAILABLE }),
    RestaurantTable.countDocuments({
      status: { $in: [TABLE_STATUS.CLEANING_PENDING, TABLE_STATUS.CLEANING] },
    }),
    Order.countDocuments({
      status: { $in: [ORDER_STATUS.PLACED, ORDER_STATUS.PREPARING, ORDER_STATUS.READY] },
    }),
    User.countDocuments({ role: ROLES.CUSTOMER }),
    User.countDocuments({ role: { $in: [ROLES.WAITER, ROLES.CLEANER, ROLES.ADMIN] } }),
    Payment.aggregate([
      { $match: { status: PAYMENT_STATUS.SUCCESS, paidAt: { $gte: startOfDay } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  return sendSuccess(res, {
    message: 'Dashboard data retrieved',
    data: {
      reservations: {
        today: todaysReservations,
        pending: pendingReservations,
        approved: approvedReservations,
      },
      tables: {
        occupied: occupiedTables,
        available: availableTables,
        cleaning: cleaningTables,
      },
      ordersInProgress,
      revenueToday: Number((revenueAgg[0]?.total || 0).toFixed(2)),
      customerCount,
      staffCount,
    },
  });
});
