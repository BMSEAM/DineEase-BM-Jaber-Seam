import { body, query } from 'express-validator';
import { SEATING_PREFERENCE, TABLE_STATUS, values } from '../config/constants.js';

export const availabilityQueryValidator = [
  query('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date must be YYYY-MM-DD'),
  query('startTime').matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('startTime must be HH:mm'),
  query('guests').optional().isInt({ min: 1 }).toInt(),
  query('seatingPreference').optional().isIn(values(SEATING_PREFERENCE)),
];

export const tableValidator = [
  body('tableNumber').trim().notEmpty().withMessage('Table number is required'),
  body('capacity').isInt({ min: 1, max: 20 }).withMessage('Capacity must be 1-20'),
  body('seatingPreference').optional().isIn(values(SEATING_PREFERENCE)),
];

export const tableUpdateValidator = [
  body('tableNumber').optional().trim().notEmpty(),
  body('capacity').optional().isInt({ min: 1, max: 20 }),
  body('seatingPreference').optional().isIn(values(SEATING_PREFERENCE)),
  body('status').optional().isIn(values(TABLE_STATUS)),
  body('isActive').optional().isBoolean(),
];
