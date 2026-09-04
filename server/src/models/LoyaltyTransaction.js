import mongoose from 'mongoose';
import { LOYALTY_TX_TYPE, values } from '../config/constants.js';

const { Schema, model } = mongoose;

/**
 * Ledger of loyalty point movements (F20). `balanceAfter` records the running
 * balance so the history is auditable without recomputation.
 */
const loyaltyTransactionSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: values(LOYALTY_TX_TYPE), required: true },
    points: { type: Number, required: true, min: 0 }, // magnitude, always positive
    balanceAfter: { type: Number, required: true, min: 0 },
    description: { type: String, default: '' },
    payment: { type: Schema.Types.ObjectId, ref: 'Payment' },
  },
  { timestamps: true }
);

export const LoyaltyTransaction = model('LoyaltyTransaction', loyaltyTransactionSchema);
