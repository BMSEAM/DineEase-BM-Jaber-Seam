import mongoose from 'mongoose';
import { RESERVATION_STATUS, SEATING_PREFERENCE, values } from '../config/constants.js';

const { Schema, model } = mongoose;

const reservationSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    table: { type: Schema.Types.ObjectId, ref: 'RestaurantTable', required: true, index: true },
    date: { type: String, required: true }, // YYYY-MM-DD (local calendar day)
    startTime: { type: String, required: true }, // HH:mm
    endTime: { type: String, required: true }, // HH:mm (derived from duration)
    // Absolute start/end instants used for overlap detection.
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true, index: true },
    guests: { type: Number, required: true, min: 1 },
    seatingPreference: {
      type: String,
      enum: values(SEATING_PREFERENCE),
      default: SEATING_PREFERENCE.ANY,
    },
    status: {
      type: String,
      enum: values(RESERVATION_STATUS),
      default: RESERVATION_STATUS.PENDING,
      index: true,
    },
    notes: { type: String, trim: true, default: '', maxlength: 400 },
    // Set when an admin/waiter approves or rejects.
    decidedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    decisionReason: { type: String, trim: true, default: '' },
    // Convenience link to the pre-order (F05), if any.
    order: { type: Schema.Types.ObjectId, ref: 'Order' },
  },
  { timestamps: true }
);

// Fast lookups for overlap checks on a given table.
reservationSchema.index({ table: 1, startAt: 1, endAt: 1 });

export const Reservation = model('Reservation', reservationSchema);
