import { Router } from 'express';
import { getFavourites, addFavourite, removeFavourite } from '../controllers/favourite.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validateObjectId.js';

const router = Router();

router.use(authenticate);

// F06 - Favourite Menu Items
router.get('/', getFavourites);
router.post('/', addFavourite);
router.delete('/:menuItemId', validateObjectId('menuItemId'), removeFavourite);

export default router;
