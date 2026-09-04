import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const menuCategorySchema = new Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 60 },
    description: { type: String, trim: true, default: '' },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const MenuCategory = model('MenuCategory', menuCategorySchema);
