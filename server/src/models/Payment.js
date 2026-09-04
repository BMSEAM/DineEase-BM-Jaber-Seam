import mongoose from 'mongoose';
import { PAYMENT_METHOD, PAYMENT_STATUS, values } from '../config/constants.js';

const { Schema, model } = mongoose;

const paymentSchema = new Schema(
  {
    // Uniqueness/indexing for `order` is provided by the partial index below.
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    method: { type: String, enum: values(PAYMENT_METHOD), required: true },
    // Virtual gateway reference (simulated bKash/Nagad trx id).
    transactionRef: { type: String, required: true, unique: true },
    amount: { type: Number, required: true, min: 0 }, // amount actually charged
    pointsRedeemed: { type: Number, default: 0, min: 0 },
    discountApplied: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: values(PAYMENT_STATUS),
      default: PAYMENT_STATUS.PENDING,
      index: true,
    },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

// Idempotency guard: at most one *successful* payment may exist per order.
// A partial index lets pending/failed attempts coexist while blocking a second
// success (e.g. from a retried or concurrent request).
paymentSchema.index(
  { order: 1 },
  { unique: true, partialFilterExpression: { status: PAYMENT_STATUS.SUCCESS } }
);

export const Payment = model('Payment', paymentSchema);
