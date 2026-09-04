import { Router } from 'express';
import { getReviews, getMyReviews, createReview, updateReview, deleteReview } from '../controllers/review.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validateObjectId.js';

const router = Router();

// Public route to see all reviews
router.get('/', getReviews);

// Protected routes for managing reviews
router.use(authenticate);

router.get('/my', getMyReviews);
router.post('/', createReview);
router.patch('/:id', validateObjectId('id'), updateReview);
router.delete('/:id', validateObjectId('id'), deleteReview);

export default router;
