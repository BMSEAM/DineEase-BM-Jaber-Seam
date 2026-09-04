import { body } from 'express-validator';
import { ROLES } from '../config/constants.js';

// Public self-registration is restricted to the customer role;
// staff accounts are created by an admin (F14).
export const registerValidator = [
  body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone').optional().trim(),
];

export const loginValidator = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

export const updateProfileValidator = [
  body('name').optional().trim().isLength({ min: 2, max: 80 }),
  body('phone').optional().trim(),
];

export const changePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

export const allowedSelfRegisterRole = ROLES.CUSTOMER;
