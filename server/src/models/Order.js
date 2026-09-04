import mongoose from 'mongoose';
import { ORDER_TYPE, ORDER_STATUS, values } from '../config/constants.js';
import { orderItemSchema } from './OrderItem.js';

const { Schema, model } = mongoose;

const orderSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Pre-orders (F05) are attached to a reservation; takeaway may stand alone.
    reservation: { type: Schema.Types.ObjectId, ref: 'Reservation', index: true },
    type: { type: String, enum: values(ORDER_TYPE), default: ORDER_TYPE.DINE_IN },
    items: {
      type: [orderItemSchema],
      validate: [(arr) => arr.length > 0, 'An order must contain at least one item'],
    },
    subtotal: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: values(ORDER_STATUS),
      default: ORDER_STATUS.PLACED,
      index: true,
    },
    isPaid: { type: Boolean, default: false },
    // Refund extension: set when a successful payment for this order is refunded.
    isRefunded: { type: Boolean, default: false },
    refundedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const Order = model('Order', orderSchema);
