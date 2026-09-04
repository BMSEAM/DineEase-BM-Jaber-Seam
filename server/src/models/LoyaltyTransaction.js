import mongoose from 'mongoose';

const loyaltyTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['earn', 'redeem', 'refund'],
      required: true,
    },
    points: {
      type: Number,
      required: true,
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      description: 'Can be an Order ID or Refund ID',
    },
    description: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const LoyaltyTransaction = mongoose.model('LoyaltyTransaction', loyaltyTransactionSchema);
