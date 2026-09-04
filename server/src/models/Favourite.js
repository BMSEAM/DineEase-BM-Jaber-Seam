import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * Join collection implementing the many-to-many between User and MenuItem (F06).
 * Compound unique index stops a dish being favourited twice by the same user.
 */
const favouriteSchema = new Schema(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    menuItem: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  },
  { timestamps: true }
);

favouriteSchema.index({ customer: 1, menuItem: 1 }, { unique: true });

export const Favourite = model('Favourite', favouriteSchema);
