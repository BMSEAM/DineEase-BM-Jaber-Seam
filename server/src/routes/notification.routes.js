import { Router } from 'express';
import {
  listNotifications,
  markRead,
  markAllRead,
} from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validateObjectId.js';

const router = Router();

router.get('/', authenticate, listNotifications);
router.patch('/read-all', authenticate, markAllRead);
router.patch('/:id/read', authenticate, validateObjectId(), markRead);

export default router;
