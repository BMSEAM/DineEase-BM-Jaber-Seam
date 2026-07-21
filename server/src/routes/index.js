import { Router } from 'express';
import authRoutes from './auth.routes.js';
import menuRoutes from './menu.routes.js';
import tableRoutes from './table.routes.js';
import reservationRoutes from './reservation.routes.js';
import orderRoutes from './order.routes.js';
import favouriteRoutes from './favourite.routes.js';
import reviewRoutes from './review.routes.js';
import notificationRoutes from './notification.routes.js';
import cleaningRoutes from './cleaning.routes.js';
import staffRoutes from './staff.routes.js';
import paymentRoutes from './payment.routes.js';
import refundRoutes from './refund.routes.js';
import invoiceRoutes from './invoice.routes.js';
import loyaltyRoutes from './loyalty.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.get('/health', (req, res) =>
  res.json({ success: true, message: 'DineEase API is running', data: { uptime: process.uptime() } })
);

router.use('/auth', authRoutes);
router.use('/', menuRoutes); // /menu-items, /categories
router.use('/tables', tableRoutes);
router.use('/reservations', reservationRoutes);
router.use('/orders', orderRoutes);
router.use('/favourites', favouriteRoutes);
router.use('/reviews', reviewRoutes);
router.use('/notifications', notificationRoutes);
router.use('/cleaning', cleaningRoutes);
router.use('/staff', staffRoutes);
router.use('/payments', paymentRoutes);
router.use('/refunds', refundRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/loyalty', loyaltyRoutes);
router.use('/admin', adminRoutes);

export default router;
