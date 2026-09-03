import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

/**
 * Runs express-validator chains and short-circuits with a 400 if any fail.
 * Usage: router.post('/', validators, validate, controller)
 */
export function validate(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const errors = result.array().map((e) => ({ field: e.path, message: e.msg }));
  return next(ApiError.badRequest('Validation failed', errors));
}
