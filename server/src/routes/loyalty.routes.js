import { Router } from 'express';
import { getLoyalty } from '../controllers/loyalty.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { ROLES } from '../config/constants.js';

const router = Router();

// Loyalty is a customer-only feature (F20). Staff/admin tokens must not read a
// customer loyalty ledger through this endpoint.
router.get('/', authenticate, authorize(ROLES.CUSTOMER), getLoyalty);

export default router;
