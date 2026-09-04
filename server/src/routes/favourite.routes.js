import { Router } from 'express';
import { body } from 'express-validator';
import {
  listFavourites,
  addFavourite,
  removeFavourite,
} from '../controllers/favourite.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { validateObjectId } from '../middleware/validateObjectId.js';

const router = Router();

router.get('/', authenticate, listFavourites);
router.post(
  '/',
  authenticate,
  [body('menuItem').isMongoId().withMessage('A valid menuItem is required')],
  validate,
  addFavourite
);
router.delete('/:menuItemId', authenticate, validateObjectId('menuItemId'), removeFavourite);

export default router;
