import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * Review of a completed experience (F07). It attaches to EITHER a completed
 * reservation (a dine-in visit) OR a completed standalone takeaway order — so a
 * customer who ordered from the menu without booking can still review. Exactly
 * one of `reservation`/`order` is set (enforced in the controller). Uniqueness
 * is per (customer, reservation) and per (customer, order).
 */
const reviewSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reservation: { type: Schema.Types.ObjectId, ref: 'Reservation' },
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, default: '', maxlength: 600 },
  },
  { timestamps: true }
);

// One review per reservation and per order, per customer. Partial filters let
// the "other" key be absent without colliding on null.
reviewSchema.index(
  { customer: 1, reservation: 1 },
  { unique: true, partialFilterExpression: { reservation: { $type: 'objectId' } } }
);
reviewSchema.index(
  { customer: 1, order: 1 },
  { unique: true, partialFilterExpression: { order: { $type: 'objectId' } } }
);

export const Review = model('Review', reviewSchema);
