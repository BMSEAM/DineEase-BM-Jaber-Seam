import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { Review } from '../models/Review.js';
import mongoose from 'mongoose';

const Reservation = mongoose.model('Reservation');

export const getReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find()
    .populate('user', 'name email')
    .sort({ createdAt: -1 });

  return sendSuccess(res, {
    message: 'Reviews retrieved',
    data: reviews
  });
});

export const getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ user: req.user._id })
    .sort({ createdAt: -1 });

  return sendSuccess(res, {
    message: 'Your reviews retrieved',
    data: reviews
  });
});

export const createReview = asyncHandler(async (req, res) => {
  const { reservation, rating, comment } = req.body;

  if (!reservation || !rating) {
    throw ApiError.badRequest('Reservation ID and rating are required');
  }

  // Ensure reservation exists and belongs to the user
  const visit = await Reservation.findOne({ _id: reservation, customerId: req.user._id });
  if (!visit) {
    throw ApiError.notFound('Reservation not found or does not belong to you');
  }

  // Prevent duplicate reviews for the same reservation
  const existing = await Review.findOne({ user: req.user._id, reservation });
  if (existing) {
    throw ApiError.badRequest('You have already reviewed this visit');
  }

  const review = await Review.create({
    user: req.user._id,
    reservation,
    rating,
    comment
  });

  return sendSuccess(res, {
    message: 'Review submitted successfully',
    data: review,
    statusCode: 201
  });
});

export const updateReview = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rating, comment } = req.body;

  const review = await Review.findOne({ _id: id, user: req.user._id });
  if (!review) {
    throw ApiError.notFound('Review not found or unauthorized');
  }

  if (rating) review.rating = rating;
  if (comment !== undefined) review.comment = comment;

  await review.save();

  return sendSuccess(res, {
    message: 'Review updated successfully',
    data: review
  });
});

export const deleteReview = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const review = await Review.findOneAndDelete({ _id: id, user: req.user._id });
  if (!review) {
    throw ApiError.notFound('Review not found or unauthorized');
  }

  return sendSuccess(res, {
    message: 'Review deleted successfully'
  });
});
