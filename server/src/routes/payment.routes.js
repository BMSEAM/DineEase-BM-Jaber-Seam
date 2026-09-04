import { Router } from 'express';
import { body } from 'express-validator';
import { createPayment, myPayments } from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { PAYMENT_METHOD, values } from '../config/constants.js';

const router = Router();

router.post(
  '/',
  authenticate,
  [
    body('order').isMongoId().withMessage('A valid order is required'),
    body('method').isIn(values(PAYMENT_METHOD)).withMessage('Method must be bkash or nagad'),
    body('redeemPoints').optional().isInt({ min: 0 }).withMessage('redeemPoints must be >= 0'),
    body('simulate').optional().isIn(['success', 'fail']),
  ],
  validate,
  createPayment
);
router.get('/my', authenticate, myPayments);

export default router;
