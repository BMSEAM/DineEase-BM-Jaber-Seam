import { Router } from 'express';
import { myInvoices, getInvoice } from '../controllers/invoice.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validateObjectId } from '../middleware/validateObjectId.js';

const router = Router();

router.get('/my', authenticate, myInvoices);
router.get('/:id', authenticate, validateObjectId(), getInvoice);

export default router;
