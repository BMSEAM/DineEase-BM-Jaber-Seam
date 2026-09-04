import { Router } from 'express';
import { getDashboard } from '../controllers/dashboard.controller.js';
import { getReport } from '../controllers/report.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { ROLES } from '../config/constants.js';

const router = Router();
const adminOnly = [authenticate, authorize(ROLES.ADMIN)];

router.get('/dashboard', adminOnly, getDashboard);
router.get('/reports', adminOnly, getReport);

export default router;
