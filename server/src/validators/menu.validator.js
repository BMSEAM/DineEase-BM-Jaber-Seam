import { body, query } from 'express-validator';

export const menuQueryValidator = [
  query('search').optional().trim(),
  query('category').optional().trim(),
  query('minPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('maxPrice').optional().isFloat({ min: 0 }).toFloat(),
  query('available').optional().isBoolean().toBoolean(),
  query('sort').optional().isIn(['price', '-price', 'name', '-name', 'newest']),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
];

export const menuItemValidator = [
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Name is required (2-120 chars)'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a non-negative number'),
  body('category').isMongoId().withMessage('A valid category is required'),
  body('description').optional().trim().isLength({ max: 600 }),
  body('imageUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Image URL must be a valid http(s) link'),
  body('isAvailable').optional().isBoolean(),
];

export const menuItemUpdateValidator = [
  body('name').optional().trim().isLength({ min: 2, max: 120 }),
  body('price').optional().isFloat({ min: 0 }),
  body('category').optional().isMongoId(),
  body('description').optional().trim().isLength({ max: 600 }),
  body('imageUrl')
    .optional({ checkFalsy: true })
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage('Image URL must be a valid http(s) link'),
  body('isAvailable').optional().isBoolean(),
];

export const categoryValidator = [
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Category name is required'),
  body('description').optional().trim(),
  body('displayOrder').optional().isInt(),
];

// Partial update: every field optional, but name (if sent) must be valid.
export const categoryUpdateValidator = [
  body('name').optional().trim().isLength({ min: 2, max: 60 }).withMessage('Category name must be 2-60 chars'),
  body('description').optional().trim().isLength({ max: 300 }),
  body('displayOrder').optional().isInt(),
  body('isActive').optional().isBoolean(),
];
