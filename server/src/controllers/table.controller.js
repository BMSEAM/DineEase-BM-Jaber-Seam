import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { RestaurantTable } from '../models/RestaurantTable.js';
import { findAvailableTables, recalcTableStatus } from '../services/reservation.service.js';
import { TABLE_STATUS } from '../config/constants.js';

/**
 * F13 Table Management (admin) + F08 Real-time Availability (authenticated).
 */

// GET /api/tables  (staff/admin) — full table list with status
export const listTables = asyncHandler(async (req, res) => {
  const tables = await RestaurantTable.find().sort({ tableNumber: 1 });
  return sendSuccess(res, { message: 'Tables retrieved', data: tables });
});

// GET /api/tables/available?date=&startTime=&guests=&seatingPreference=  (F08)
export const getAvailableTables = asyncHandler(async (req, res) => {
  const { date, startTime, guests, seatingPreference } = req.query;
  const { window, tables } = await findAvailableTables({
    date,
    startTime,
    guests,
    seatingPreference,
  });
  return sendSuccess(res, {
    message: 'Available tables retrieved',
    data: tables,
    meta: { window, count: tables.length },
  });
});

// POST /api/tables  (admin)
export const createTable = asyncHandler(async (req, res) => {
  const table = await RestaurantTable.create(req.body);
  return sendSuccess(res, { statusCode: 201, message: 'Table created', data: table });
});

// PATCH /api/tables/:id  (admin)
export const updateTable = asyncHandler(async (req, res) => {
  const table = await RestaurantTable.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!table) throw ApiError.notFound('Table not found');
  return sendSuccess(res, { message: 'Table updated', data: table });
});

// PATCH /api/tables/:id/disable  (admin) — soft disable
export const disableTable = asyncHandler(async (req, res) => {
  const table = await RestaurantTable.findById(req.params.id);
  if (!table) throw ApiError.notFound('Table not found');
  table.isActive = false;
  table.status = TABLE_STATUS.DISABLED;
  await table.save();
  return sendSuccess(res, { message: 'Table disabled', data: table });
});

// PATCH /api/tables/:id/enable  (admin)
export const enableTable = asyncHandler(async (req, res) => {
  const table = await RestaurantTable.findById(req.params.id);
  if (!table) throw ApiError.notFound('Table not found');
  table.isActive = true;
  await table.save();
  // Recalculate rather than force-available: a pending cleaning task must win.
  const recalced = await recalcTableStatus(table._id);
  return sendSuccess(res, { message: 'Table enabled', data: recalced || table });
});
