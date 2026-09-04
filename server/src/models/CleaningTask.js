import mongoose from 'mongoose';
import { CLEANING_STATUS, CLEANING_AREA, values } from '../config/constants.js';

const { Schema, model } = mongoose;

/**
 * Cleaning workflow (F15). Two sources:
 *  - auto: a waiter completes dining → a TABLE task tied to that reservation;
 *  - manual: an admin or cleaner logs a task for any area (table/floor/window/
 *    restroom/kitchen/general).
 * Progressed by a cleaner: pending -> in_progress -> done.
 */
const cleaningTaskSchema = new Schema(
  {
    area: {
      type: String,
      enum: values(CLEANING_AREA),
      default: CLEANING_AREA.TABLE,
      index: true,
    },
    // Only set for TABLE tasks. Floor/window/etc. tasks have no table.
    table: { type: Schema.Types.ObjectId, ref: 'RestaurantTable', index: true },
    // Free-text location for non-table areas (e.g. "Main hall floor", "Front window").
    location: { type: String, trim: true, default: '', maxlength: 120 },
    description: { type: String, trim: true, default: '', maxlength: 300 },
    reservation: { type: Schema.Types.ObjectId, ref: 'Reservation' },
    raisedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // waiter/admin/cleaner
    cleaner: { type: Schema.Types.ObjectId, ref: 'User' }, // assigned/acting cleaner
    status: {
      type: String,
      enum: values(CLEANING_STATUS),
      default: CLEANING_STATUS.PENDING,
      index: true,
    },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// At most one cleaning task per reservation (guards concurrent completion).
cleaningTaskSchema.index(
  { reservation: 1 },
  { unique: true, partialFilterExpression: { reservation: { $type: 'objectId' } } }
);

export const CleaningTask = model('CleaningTask', cleaningTaskSchema);
