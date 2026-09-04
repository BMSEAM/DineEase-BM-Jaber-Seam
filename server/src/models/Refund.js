import mongoose from 'mongoose';
import { REFUND_STATUS, values } from '../config/constants.js';

const { Schema, model } = mongoose;

/**
 * Simulated refund record (user-requested extension beyond the formal F16 list).
 *
 * A refund is an auditable document that never rewrites the original invoice or
 * payment charge. It captures who requested it, who processed it, the reversed
 * loyalty movements and a simulated gateway reference.
 *
 * Idempotency: `idempotencyKey` is unique, so replaying the same request (retry
 * or concurrent double-click) resolves to the single original record instead of
 * creating a second refund. There can also be at most one non-rejected refund
 * per payment (partial unique index below), preventing a double refund.
 */
const refundSchema = new Schema(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    // Uniqueness/indexing for `payment` comes from the partial index below.
    payment: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    reason: { type: String, trim: true, maxlength: 500, default: '' },
    status: {
      type: String,
      enum: values(REFUND_STATUS),
      default: REFUND_STATUS.PENDING,
      index: true,
    },
    // Simulated gateway reference — only set once the refund is executed.
    simulatedRef: { type: String, default: null },
    // Idempotency key for safe retries of the *request*.
    idempotencyKey: { type: String, required: true, unique: true },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    processedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    // Loyalty reversal bookkeeping, recorded once when executed.
    pointsReversed: { type: Number, default: 0, min: 0 }, // earned points clawed back
    pointsRestored: { type: Number, default: 0, min: 0 }, // redeemed points returned
    requestedAt: { type: Date, default: Date.now },
    processedAt: { type: Date, default: null },
    decisionNote: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { timestamps: true }
);

// At most one *active* (pending or approved) refund per payment. Rejected
// refunds may coexist so a customer can re-request after a decline.
refundSchema.index(
  { payment: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: [REFUND_STATUS.PENDING, REFUND_STATUS.APPROVED] },
    },
  }
);

export const Refund = model('Refund', refundSchema);
