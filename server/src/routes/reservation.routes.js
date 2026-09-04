import { Router } from 'express';
import {
  createReservation,
  myReservations,
  getReservation,
  listReservations,
  approveReservation,
  rejectReservation,
  cancelReservation,
} from '../controllers/reservation.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { ROLES } from '../config/constants.js';
import {
  createReservationValidator,
  historyQueryValidator,
  rejectValidator,
} from '../validators/reservation.validator.js';

const router = Router();
const staffAndAdmin = [authenticate, authorize(ROLES.ADMIN, ROLES.WAITER)];

// Customer
router.post('/', authenticate, createReservationValidator, validate, createReservation);
router.get('/my', authenticate, historyQueryValidator, validate, myReservations);
router.patch('/:id/cancel', authenticate, validateObjectId(), cancelReservation);

// Staff / admin (F09)
router.get('/', staffAndAdmin, listReservations);
router.patch('/:id/approve', staffAndAdmin, validateObjectId(), approveReservation);
router.patch('/:id/reject', staffAndAdmin, validateObjectId(), rejectValidator, validate, rejectReservation);

// Shared (owner or staff) — keep after specific routes to avoid clashes
router.get('/:id', authenticate, validateObjectId(), getReservation);

export default router;
