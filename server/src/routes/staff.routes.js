import { Router } from 'express';
import { body } from 'express-validator';
import {
  listStaff,
  createStaff,
  updateStaff,
  setStaffActive,
} from '../controllers/staff.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { ROLES } from '../config/constants.js';

const router = Router();
const adminOnly = [authenticate, authorize(ROLES.ADMIN)];

router.get('/', adminOnly, listStaff);
router.post(
  '/',
  adminOnly,
  [
    body('name').trim().isLength({ min: 2, max: 80 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn([ROLES.WAITER, ROLES.CLEANER, ROLES.ADMIN]),
    body('phone').optional().trim(),
  ],
  validate,
  createStaff
);
router.patch('/:id', adminOnly, validateObjectId(), updateStaff);
router.patch('/:id/disable', adminOnly, validateObjectId(), setStaffActive(false));
router.patch('/:id/enable', adminOnly, validateObjectId(), setStaffActive(true));

export default router;
