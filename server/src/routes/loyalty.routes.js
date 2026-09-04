import { Router } from 'express';
import { getLoyaltyInfo } from '../controllers/loyalty.controller.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

// F20 - Customer Loyalty and Reward Points
router.get('/', getLoyaltyInfo);

export default router;
