import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const menuItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120, index: true },
    description: { type: String, trim: true, default: '', maxlength: 600 },
    price: { type: Number, required: true, min: 0 },
    category: { type: Schema.Types.ObjectId, ref: 'MenuCategory', required: true, index: true },
    imageUrl: { type: String, trim: true, default: '' },
    isAvailable: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Text index powers F02 search-by-name.
menuItemSchema.index({ name: 'text', description: 'text' });

export const MenuItem = model('MenuItem', menuItemSchema);
