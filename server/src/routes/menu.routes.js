import { Router } from 'express';
import {
  listMenuItems,
  getMenuItem,
  listCategories,
} from '../controllers/menu.controller.js';
import {
  createMenuItem,
  updateMenuItem,
  toggleAvailability,
  deleteMenuItem,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/menuAdmin.controller.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/authorize.js';
import { validate } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';
import { ROLES } from '../config/constants.js';
import {
  menuQueryValidator,
  menuItemValidator,
  menuItemUpdateValidator,
  categoryValidator,
  categoryUpdateValidator,
} from '../validators/menu.validator.js';

const router = Router();
const adminOnly = [authenticate, authorize(ROLES.ADMIN)];

// ---- Categories ----
router.get('/categories', listCategories);
router.post('/categories', adminOnly, categoryValidator, validate, createCategory);
router.patch('/categories/:id', adminOnly, validateObjectId(), categoryUpdateValidator, validate, updateCategory);
router.delete('/categories/:id', adminOnly, validateObjectId(), deleteCategory);

// ---- Menu items (F01/F02 public read, F12 admin write) ----
router.get('/menu-items', menuQueryValidator, validate, listMenuItems);
router.get('/menu-items/:id', validateObjectId(), getMenuItem);
router.post('/menu-items', adminOnly, menuItemValidator, validate, createMenuItem);
router.patch(
  '/menu-items/:id',
  adminOnly,
  validateObjectId(),
  menuItemUpdateValidator,
  validate,
  updateMenuItem
);
router.patch('/menu-items/:id/availability', adminOnly, validateObjectId(), toggleAvailability);
router.delete('/menu-items/:id', adminOnly, validateObjectId(), deleteMenuItem);

export default router;
