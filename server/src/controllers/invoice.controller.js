import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { Invoice } from '../models/Invoice.js';
import { ROLES } from '../config/constants.js';

/**
 * F17 Digital Invoice — view/download. The frontend renders this JSON as a
 * printable document; ownership is enforced (customers see only their own).
 */

// GET /api/invoices/my
export const myInvoices = asyncHandler(async (req, res) => {
  const invoices = await Invoice.find({ customer: req.user._id }).sort({ issuedAt: -1 });
  return sendSuccess(res, { message: 'Invoices retrieved', data: invoices });
});

// GET /api/invoices/:id
export const getInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findById(req.params.id);
  if (!invoice) throw ApiError.notFound('Invoice not found');

  const isOwner = String(invoice.customer) === String(req.user._id);
  if (!isOwner && req.user.role !== ROLES.ADMIN) {
    throw ApiError.forbidden('You cannot view this invoice');
  }
  return sendSuccess(res, { message: 'Invoice retrieved', data: invoice });
});
