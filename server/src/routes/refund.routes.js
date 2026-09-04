import { Router } from 'express';
import { body } from 'express-validator';
import {
  requestRefund,
  processRefund,
  rejectRefund,
  myRefunds,
  listRefunds,
} from '../controllers/refund.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { ROLES } from '../config/constants.js';

const router = Router();
const customerOnly = [authenticate, authorize(ROLES.CUSTOMER)];
// Refunds are a financial action — only admins may execute them. Waiters and
// cleaners must never gain refund authority.
const adminOnly = [authenticate, authorize(ROLES.ADMIN)];

// Customer request + history
router.post(
  '/',
  customerOnly,
  [
    body('order').isMongoId().withMessage('A valid order is required'),
    body('reason').optional().trim().isLength({ max: 500 }),
    body('idempotencyKey').optional().trim().isLength({ max: 120 }),
  ],
  validate,
  requestRefund
);
router.get('/my', customerOnly, myRefunds);

// Admin management
router.get('/', adminOnly, listRefunds);
router.post('/:id/process', adminOnly, validateObjectId(), processRefund);
router.post('/:id/reject', adminOnly, validateObjectId(), rejectRefund);

export default router;
