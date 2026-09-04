import { Router } from 'express';
import {
  createOrder,
  myOrders,
  getOrder,
  listOrders,
  updateOrderStatus,
} from '../controllers/order.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { ROLES } from '../config/constants.js';
import {
  createOrderValidator,
  updateStatusValidator,
  orderListQueryValidator,
} from '../validators/order.validator.js';

const router = Router();
const staffAndAdmin = [authenticate, authorize(ROLES.ADMIN, ROLES.WAITER)];

router.post('/', authenticate, createOrderValidator, validate, createOrder);
router.get('/my', authenticate, myOrders);
router.get('/', staffAndAdmin, orderListQueryValidator, validate, listOrders);
router.patch(
  '/:id/status',
  staffAndAdmin,
  validateObjectId(),
  updateStatusValidator,
  validate,
  updateOrderStatus
);
router.get('/:id', authenticate, validateObjectId(), getOrder);

export default router;
