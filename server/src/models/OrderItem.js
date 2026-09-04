import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * OrderItem is an embedded sub-document of Order. It captures a snapshot of
 * the menu item's name/price at order time so historical invoices stay correct
 * even if the menu changes later.
 */
export const orderItemSchema = new Schema(
  {
    menuItem: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
    name: { type: String, required: true }, // snapshot
    unitPrice: { type: Number, required: true, min: 0 }, // snapshot
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 }, // unitPrice * quantity
  },
  { _id: false }
);
