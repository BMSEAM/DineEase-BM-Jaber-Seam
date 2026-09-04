import mongoose from 'mongoose';

const favouriteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate favourites for the same user and item
favouriteSchema.index({ user: 1, menuItem: 1 }, { unique: true });

export const Favourite = mongoose.model('Favourite', favouriteSchema);
