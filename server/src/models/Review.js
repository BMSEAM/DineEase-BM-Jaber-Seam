import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    reservation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reservation',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxLength: 500,
    },
  },
  { timestamps: true }
);

// Prevent duplicate reviews for the same reservation by the same user
reviewSchema.index({ user: 1, reservation: 1 }, { unique: true });

export const Review = mongoose.model('Review', reviewSchema);
