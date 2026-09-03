import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError.js';

/**
 * Guards routes with an :id (or custom) param, rejecting malformed ObjectIds
 * before they reach the database. Prevents CastError noise and probing.
 */
export function validateObjectId(param = 'id') {
  return (req, res, next) => {
    const value = req.params[param];
    if (!mongoose.Types.ObjectId.isValid(value)) {
      return next(ApiError.badRequest(`Invalid ${param}`));
    }
    return next();
  };
}
