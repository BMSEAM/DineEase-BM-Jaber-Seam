import { body, query } from 'express-validator';
import { SEATING_PREFERENCE, RESERVATION_STATUS, values } from '../config/constants.js';

export const createReservationValidator = [
  body('table').isMongoId().withMessage('A valid table is required'),
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date must be YYYY-MM-DD'),
  body('startTime')
    .matches(/^([01]\d|2[0-3]):[0-5]\d$/)
    .withMessage('startTime must be HH:mm')
    .bail()
    .matches(/^([01]\d|2[0-3]):(00|30)$/)
    .withMessage('startTime must fall on a :00 or :30 slot'),
  body('guests').isInt({ min: 1 }).withMessage('At least 1 guest is required'),
  body('seatingPreference').optional().isIn(values(SEATING_PREFERENCE)),
  body('notes').optional().trim().isLength({ max: 400 }),
  // Optional pre-order (F05) attached at creation.
  body('items').optional().isArray(),
  body('items.*.menuItem').optional().isMongoId(),
  body('items.*.quantity').optional().isInt({ min: 1 }),
  body('orderType').optional().isIn(['dine_in', 'takeaway']),
];

export const historyQueryValidator = [
  query('status').optional().isIn(values(RESERVATION_STATUS)),
];

export const rejectValidator = [
  body('reason').optional().trim().isLength({ max: 300 }),
];
