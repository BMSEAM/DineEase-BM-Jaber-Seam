import { Router } from 'express';
import { body } from 'express-validator';
import {
  createReview,
  listReviews,
  myReviews,
  updateReview,
  deleteReview,
} from '../controllers/review.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { ROLES } from '../config/constants.js';

const router = Router();
const customerOnly = [authenticate, authorize(ROLES.CUSTOMER)];

router.get('/', listReviews); // public
router.get('/my', customerOnly, myReviews);
router.post(
  '/',
  customerOnly,
  [
    body('reservation').optional().isMongoId().withMessage('A valid reservation id is required'),
    body('order').optional().isMongoId().withMessage('A valid order id is required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    body('comment').optional().trim().isLength({ max: 600 }),
  ],
  validate,
  createReview
);
router.patch(
  '/:id',
  customerOnly,
  validateObjectId(),
  [
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
    body('comment').optional().trim().isLength({ max: 600 }),
  ],
  validate,
  updateReview
);
router.delete('/:id', customerOnly, validateObjectId(), deleteReview);

export default router;
