import { Router } from 'express';
import {
  listTables,
  getAvailableTables,
  createTable,
  updateTable,
  disableTable,
  enableTable,
} from '../controllers/table.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { ROLES } from '../config/constants.js';
import {
  availabilityQueryValidator,
  tableValidator,
  tableUpdateValidator,
} from '../validators/table.validator.js';

const router = Router();
const staffAndAdmin = [authenticate, authorize(ROLES.ADMIN, ROLES.WAITER)];
const adminOnly = [authenticate, authorize(ROLES.ADMIN)];

// F08 — any authenticated user can check availability while booking.
router.get('/available', authenticate, availabilityQueryValidator, validate, getAvailableTables);

// Waiter/admin manage tables; cleaners get read access so they can pick a table
// when logging a manual cleaning task.
router.get('/', authenticate, authorize(ROLES.ADMIN, ROLES.WAITER, ROLES.CLEANER), listTables);
router.post('/', adminOnly, tableValidator, validate, createTable);
router.patch('/:id', adminOnly, validateObjectId(), tableUpdateValidator, validate, updateTable);
router.patch('/:id/disable', adminOnly, validateObjectId(), disableTable);
router.patch('/:id/enable', adminOnly, validateObjectId(), enableTable);

export default router;
