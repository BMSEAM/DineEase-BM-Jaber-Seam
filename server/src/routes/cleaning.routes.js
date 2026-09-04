import { Router } from 'express';
import { body } from 'express-validator';
import {
  completeDining,
  createCleaningTask,
  listCleaningTasks,
  startCleaning,
  markReady,
} from '../controllers/cleaning.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { ROLES, CLEANING_AREA, values } from '../config/constants.js';

const router = Router();
const waiterOrAdmin = [authenticate, authorize(ROLES.WAITER, ROLES.ADMIN)];
const cleanerOrAdmin = [authenticate, authorize(ROLES.CLEANER, ROLES.ADMIN)];
// Management (assigning work) vs. the cleaning floor work — kept distinct:
//  - only an ADMIN creates/assigns manual cleaning tasks;
//  - only a CLEANER performs the cleaning (start / mark ready).
const adminOnly = [authenticate, authorize(ROLES.ADMIN)];
const cleanerOnly = [authenticate, authorize(ROLES.CLEANER)];

// Waiter completes dining -> raises a table cleaning task
router.patch(
  '/reservations/:id/complete',
  waiterOrAdmin,
  validateObjectId(),
  completeDining
);

// Queue is visible to the cleaner (their work) and admin (oversight).
router.get('/tasks', cleanerOrAdmin, listCleaningTasks);
// Only an admin logs/assigns a manual cleaning task (any area).
router.post(
  '/tasks',
  adminOnly,
  [
    body('area').optional().isIn(values(CLEANING_AREA)).withMessage('Invalid cleaning area'),
    body('table').optional().isMongoId().withMessage('table must be a valid id'),
    body('location').optional().trim().isLength({ max: 120 }),
    body('description').optional().trim().isLength({ max: 300 }),
  ],
  validate,
  createCleaningTask
);
// Only a cleaner does the actual cleaning.
router.patch('/tasks/:id/start', cleanerOnly, validateObjectId(), startCleaning);
router.patch('/tasks/:id/ready', cleanerOnly, validateObjectId(), markReady);

export default router;
