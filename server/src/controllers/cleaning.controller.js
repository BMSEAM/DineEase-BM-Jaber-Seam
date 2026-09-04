import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/apiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { CleaningTask } from '../models/CleaningTask.js';
import { Reservation } from '../models/Reservation.js';
import { RestaurantTable } from '../models/RestaurantTable.js';
import { notify } from '../services/notification.service.js';
import { releaseSlots, recalcTableStatus } from '../services/reservation.service.js';
import {
  CLEANING_STATUS,
  CLEANING_AREA,
  TABLE_STATUS,
  RESERVATION_STATUS,
  NOTIFICATION_TYPE,
} from '../config/constants.js';

/**
 * F15 Table Cleaning Workflow.
 * Waiter completes dining -> table Cleaning Pending + CleaningTask(pending).
 * Cleaner: start -> Cleaning; ready -> table Available + task done.
 */

// PATCH /api/cleaning/reservations/:id/complete  (waiter/admin)
export const completeDining = asyncHandler(async (req, res) => {
  const reservation = await Reservation.findById(req.params.id);
  if (!reservation) throw ApiError.notFound('Reservation not found');

  // Idempotent: completing an already-completed reservation returns its task
  // rather than erroring or creating a duplicate.
  if (reservation.status === RESERVATION_STATUS.COMPLETED) {
    const existing = await CleaningTask.findOne({ reservation: reservation._id });
    return sendSuccess(res, { message: 'Dining already completed', data: existing });
  }
  if (reservation.status !== RESERVATION_STATUS.APPROVED) {
    throw ApiError.badRequest('Only an approved reservation can be marked as dining completed');
  }
  // A future reservation cannot be completed before its dining window begins.
  if (reservation.startAt > new Date()) {
    throw ApiError.badRequest('Cannot complete dining before the reservation start time');
  }

  // Atomically claim the approved -> completed transition so concurrent
  // requests cannot both proceed to create a cleaning task.
  const claimed = await Reservation.findOneAndUpdate(
    { _id: reservation._id, status: RESERVATION_STATUS.APPROVED },
    { $set: { status: RESERVATION_STATUS.COMPLETED } },
    { new: true }
  );
  if (!claimed) {
    const existing = await CleaningTask.findOne({ reservation: reservation._id });
    return sendSuccess(res, { message: 'Dining already completed', data: existing });
  }

  // The dining window is over — free its slot locks.
  await releaseSlots(reservation._id);

  await RestaurantTable.findByIdAndUpdate(reservation.table, {
    status: TABLE_STATUS.CLEANING_PENDING,
  });

  let task;
  try {
    task = await CleaningTask.create({
      table: reservation.table,
      reservation: reservation._id,
      raisedBy: req.user._id,
      status: CLEANING_STATUS.PENDING,
    });
  } catch (err) {
    // Unique index backstop: another request already created the task.
    if (err && err.code === 11000) {
      task = await CleaningTask.findOne({ reservation: reservation._id });
    } else {
      throw err;
    }
  }

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Dining completed; cleaning task created',
    data: task,
  });
});

/**
 * Manually create a cleaning task (admin or cleaner). Covers areas beyond
 * tables — floor, window, restroom, kitchen, general.
 * POST /api/cleaning/tasks  { area, table?, location?, description? }
 */
export const createCleaningTask = asyncHandler(async (req, res) => {
  const { area = CLEANING_AREA.TABLE, table: tableId, location = '', description = '' } = req.body;

  let tableRef;
  if (area === CLEANING_AREA.TABLE) {
    if (!tableId) throw ApiError.badRequest('A table is required for a table cleaning task');
    tableRef = await RestaurantTable.findById(tableId);
    if (!tableRef) throw ApiError.notFound('Selected table not found');
  } else if (tableId) {
    // A non-table area with an optional table reference is allowed but ignored
    // for status recalculation unless it is a TABLE task.
    tableRef = await RestaurantTable.findById(tableId);
  }

  const task = await CleaningTask.create({
    area,
    table: area === CLEANING_AREA.TABLE ? tableRef._id : tableId || undefined,
    location: (location || '').trim(),
    description: (description || '').trim(),
    raisedBy: req.user._id,
    status: CLEANING_STATUS.PENDING,
  });

  // Reflect the table as needing cleaning so it is not handed out while pending.
  if (area === CLEANING_AREA.TABLE && tableRef && tableRef.status === TABLE_STATUS.AVAILABLE) {
    await RestaurantTable.findByIdAndUpdate(tableRef._id, { status: TABLE_STATUS.CLEANING_PENDING });
  }

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Cleaning task created',
    data: await task.populate('table', 'tableNumber capacity status'),
  });
});

// GET /api/cleaning/tasks?status=&mine=  (cleaner/admin)
export const listCleaningTasks = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;
  else filter.status = { $ne: CLEANING_STATUS.DONE }; // default: active queue

  // A cleaner can narrow the view to tasks they are handling.
  if (req.query.mine === 'true') filter.cleaner = req.user._id;

  const tasks = await CleaningTask.find(filter)
    .populate('table', 'tableNumber capacity status')
    .populate('raisedBy', 'name')
    .populate('cleaner', 'name')
    .sort({ createdAt: 1 });

  return sendSuccess(res, { message: 'Cleaning tasks retrieved', data: tasks });
});

// PATCH /api/cleaning/tasks/:id/start  (cleaner/admin)
export const startCleaning = asyncHandler(async (req, res) => {
  const task = await CleaningTask.findById(req.params.id);
  if (!task) throw ApiError.notFound('Cleaning task not found');
  if (task.status !== CLEANING_STATUS.PENDING) {
    throw ApiError.badRequest('Only a pending task can be started');
  }

  task.status = CLEANING_STATUS.IN_PROGRESS;
  task.cleaner = req.user._id;
  task.startedAt = new Date();
  await task.save();

  // Only a table-bound task changes a table's operational status.
  if (task.table) {
    await RestaurantTable.findByIdAndUpdate(task.table, { status: TABLE_STATUS.CLEANING });
  }

  return sendSuccess(res, { message: 'Cleaning started', data: task });
});

// PATCH /api/cleaning/tasks/:id/ready  (cleaner/admin)
export const markReady = asyncHandler(async (req, res) => {
  const task = await CleaningTask.findById(req.params.id);
  if (!task) throw ApiError.notFound('Cleaning task not found');
  if (task.status !== CLEANING_STATUS.IN_PROGRESS) {
    throw ApiError.badRequest('Only a task in progress can be marked ready');
  }

  task.status = CLEANING_STATUS.DONE;
  task.completedAt = new Date();
  await task.save();

  // Recalculate the table's operational status rather than unconditionally
  // forcing it available — a disabled table or another pending cleaning task
  // must still win. Non-table tasks (floor/window/etc.) have no table.
  if (task.table) await recalcTableStatus(task.table);

  // Notify whoever raised the task that it is finished.
  await notify({
    user: task.raisedBy,
    type: NOTIFICATION_TYPE.TABLE_READY,
    title: task.table ? 'Table ready' : 'Cleaning complete',
    message: task.table
      ? 'A table has finished cleaning and is now available.'
      : 'A cleaning task has been completed.',
    link: '/staff/tables',
  });

  return sendSuccess(res, { message: 'Cleaning task completed', data: task });
});
