import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * Concurrency guard for table reservations.
 *
 * A reservation window is decomposed into fixed 30-minute grid slots; one
 * BookingSlot document is inserted per occupied slot. The unique index on
 * `{ table, slotAt }` makes the database — not application code — the single
 * source of truth for who owns a slot. Two parallel requests for overlapping
 * windows therefore contend on the same slot insert: exactly one succeeds and
 * the other receives a duplicate-key error, which the service surfaces as 409.
 *
 * This is genuinely concurrency-safe without transactions or an in-process
 * mutex, so it works with standalone MongoDB (including mongodb-memory-server).
 */
const bookingSlotSchema = new Schema(
  {
    table: { type: Schema.Types.ObjectId, ref: 'RestaurantTable', required: true },
    slotAt: { type: Date, required: true },
    reservation: { type: Schema.Types.ObjectId, ref: 'Reservation', required: true, index: true },
  },
  { timestamps: true }
);

// The atomic uniqueness that prevents double-booking a slot.
bookingSlotSchema.index({ table: 1, slotAt: 1 }, { unique: true });

export const BookingSlot = model('BookingSlot', bookingSlotSchema);
