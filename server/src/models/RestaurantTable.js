import mongoose from 'mongoose';
import { TABLE_STATUS, SEATING_PREFERENCE, values } from '../config/constants.js';

const { Schema, model } = mongoose;

const restaurantTableSchema = new Schema(
  {
    tableNumber: { type: String, required: true, unique: true, trim: true },
    capacity: { type: Number, required: true, min: 1, max: 20 },
    seatingPreference: {
      type: String,
      enum: values(SEATING_PREFERENCE),
      default: SEATING_PREFERENCE.ANY,
    },
    status: {
      type: String,
      enum: values(TABLE_STATUS),
      default: TABLE_STATUS.AVAILABLE,
      index: true,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const RestaurantTable = model('RestaurantTable', restaurantTableSchema);
