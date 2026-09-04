import mongoose from 'mongoose';

const { Schema, model } = mongoose;

/**
 * Immutable billing snapshot generated after a successful payment (F17).
 * All monetary figures are stored so the invoice never drifts from source data.
 */
const invoiceSchema = new Schema(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    payment: { type: Schema.Types.ObjectId, ref: 'Payment', required: true },
    reservation: { type: Schema.Types.ObjectId, ref: 'Reservation' },
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Denormalised customer contact for a self-contained document.
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    items: [
      {
        _id: false,
        name: String,
        unitPrice: Number,
        quantity: Number,
        lineTotal: Number,
      },
    ],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    vat: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    transactionRef: { type: String, required: true },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// One invoice per order (F17) — guards against duplicate invoices on retry.
invoiceSchema.index({ order: 1 }, { unique: true });

export const Invoice = model('Invoice', invoiceSchema);
