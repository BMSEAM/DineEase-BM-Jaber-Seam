import { body, query } from 'express-validator';
import { ORDER_TYPE, ORDER_STATUS, values } from '../config/constants.js';

export const createOrderValidator = [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.menuItem').isMongoId().withMessage('Each item needs a valid menuItem'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('type').optional().isIn(values(ORDER_TYPE)),
  body('reservation').optional().isMongoId(),
];

export const updateStatusValidator = [
  body('status').isIn(values(ORDER_STATUS)).withMessage('Invalid order status'),
];

export const orderListQueryValidator = [
  query('status').optional().isIn(values(ORDER_STATUS)),
];
