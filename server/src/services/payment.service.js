import { Payment } from '../models/Payment.js';
import { Invoice } from '../models/Invoice.js';
import { env } from '../config/env.js';

/** Simulated gateway transaction reference (bKash/Nagad style). */
export function generateTransactionRef(method) {
  const rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `${method.toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${rand}`;
}

/** Sequential-ish invoice number based on time + random suffix. */
export function generateInvoiceNumber() {
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(
    now.getDate()
  ).padStart(2, '0')}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `INV-${stamp}-${rand}`;
}

/**
 * Compute the bill for an order after an optional discount, adding VAT.
 * Returns subtotal, discount, vat and total (all rounded to 2 dp).
 */
export function computeBill({ subtotal, discount = 0 }) {
  const discounted = Math.max(0, subtotal - discount);
  const vat = Number((discounted * env.vatRate).toFixed(2));
  const total = Number((discounted + vat).toFixed(2));
  return {
    subtotal: Number(subtotal.toFixed(2)),
    discount: Number(discount.toFixed(2)),
    vat,
    total,
  };
}

/**
 * Build and persist an invoice (F17) from an order, payment and bill breakdown.
 */
export async function createInvoice({ order, payment, reservation, customer, bill }) {
  return Invoice.create({
    invoiceNumber: generateInvoiceNumber(),
    order: order._id,
    payment: payment._id,
    reservation: reservation?._id,
    customer: customer._id,
    customerName: customer.name,
    customerEmail: customer.email,
    items: order.items.map((i) => ({
      name: i.name,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
    })),
    subtotal: bill.subtotal,
    discount: bill.discount,
    vat: bill.vat,
    total: bill.total,
    paymentMethod: payment.method,
    transactionRef: payment.transactionRef,
  });
}

export { Payment };
