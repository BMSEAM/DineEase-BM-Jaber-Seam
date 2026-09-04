import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { Review } from '../models/Review.js';
import { Reservation } from '../models/Reservation.js';
import { Order } from '../models/Order.js';
import { RESERVATION_STATUS, ORDER_STATUS } from '../config/constants.js';

/**
 * F07 Customer Reviews and Ratings. A review may be submitted for the customer's
 * own COMPLETED reservation, OR for their own completed standalone takeaway
 * order (menu order without a reservation). Only once per reservation/order.
 */

// Order statuses at which the food has been received and can be reviewed.
const REVIEWABLE_ORDER_STATUSES = [ORDER_STATUS.SERVED, ORDER_STATUS.COMPLETED];

// POST /api/reviews  { reservation? | order?, rating, comment }
export const createReview = asyncHandler(async (req, res) => {
  const { reservation: reservationId, order: orderId, rating, comment } = req.body;

  if (!reservationId && !orderId) {
    throw ApiError.badRequest('A reservation or an order is required to review');
  }
  if (reservationId && orderId) {
    throw ApiError.badRequest('Provide either a reservation or an order, not both');
  }

  let review;

  if (reservationId) {
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) throw ApiError.notFound('Reservation not found');
    if (String(reservation.customer) !== String(req.user._id)) {
      throw ApiError.forbidden('You can only review your own reservation');
    }
    if (reservation.status !== RESERVATION_STATUS.COMPLETED) {
      throw ApiError.badRequest('You can only review a completed reservation');
    }
    const existing = await Review.findOne({ customer: req.user._id, reservation: reservationId });
    if (existing) throw ApiError.conflict('You have already reviewed this reservation');

    review = await Review.create({ customer: req.user._id, reservation: reservationId, rating, comment });
  } else {
    const order = await Order.findById(orderId);
    if (!order) throw ApiError.notFound('Order not found');
    if (String(order.customer) !== String(req.user._id)) {
      throw ApiError.forbidden('You can only review your own order');
    }
    // Reservation-linked (dine-in pre-order) orders are reviewed via the
    // reservation, to keep one review per dining visit.
    if (order.reservation) {
      throw ApiError.badRequest('This order belongs to a reservation — review the reservation instead');
    }
    if (!REVIEWABLE_ORDER_STATUSES.includes(order.status)) {
      throw ApiError.badRequest('You can only review an order once it has been served or completed');
    }
    const existing = await Review.findOne({ customer: req.user._id, order: orderId });
    if (existing) throw ApiError.conflict('You have already reviewed this order');

    review = await Review.create({ customer: req.user._id, order: orderId, rating, comment });
  }

  return sendSuccess(res, { statusCode: 201, message: 'Review submitted', data: review });
});

// GET /api/reviews  — public list of recent reviews with average rating.
// Populates the visit context (date/table) so a review is clearly attributable
// to a specific dining visit.
export const listReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate('customer', 'name')
    .populate({ path: 'reservation', select: 'date startTime table', populate: { path: 'table', select: 'tableNumber' } })
    .populate({ path: 'order', select: 'type items createdAt' })
    .sort({ createdAt: -1 })
    .limit(50);

  const agg = await Review.aggregate([
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const summary = agg[0] || { avg: 0, count: 0 };

  return sendSuccess(res, {
    message: 'Reviews retrieved',
    data: reviews,
    meta: { averageRating: Number((summary.avg || 0).toFixed(2)), total: summary.count },
  });
});

// GET /api/reviews/my — includes the visit context and any pre-ordered items.
export const myReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ customer: req.user._id })
    .populate({
      path: 'reservation',
      select: 'date startTime table order',
      populate: [
        { path: 'table', select: 'tableNumber' },
        { path: 'order', select: 'items' },
      ],
    })
    .populate({ path: 'order', select: 'type items createdAt' })
    .sort({ createdAt: -1 });
  return sendSuccess(res, { message: 'Your reviews retrieved', data: reviews });
});

// PATCH /api/reviews/:id  — owner edits their own review (rating/comment).
export const updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');
  if (String(review.customer) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only edit your own review');
  }
  if (req.body.rating !== undefined) review.rating = req.body.rating;
  if (req.body.comment !== undefined) review.comment = req.body.comment;
  await review.save();
  return sendSuccess(res, { message: 'Review updated', data: review });
});

// DELETE /api/reviews/:id  — owner deletes their own review.
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw ApiError.notFound('Review not found');
  if (String(review.customer) !== String(req.user._id)) {
    throw ApiError.forbidden('You can only delete your own review');
  }
  await review.deleteOne();
  return sendSuccess(res, { message: 'Review deleted', data: { id: review._id } });
});
