import { verifyToken } from '../utils/token.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/User.js';

/**
 * Authentication middleware. Accepts the JWT from either the Authorization
 * Bearer header or the httpOnly `token` cookie, verifies it, and attaches the
 * live user document to req.user. Rejects disabled accounts.
 */
export const authenticate = asyncHandler(async (req, res, next) => {
  let token;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    token = header.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) throw ApiError.unauthorized('Authentication required');

  const decoded = verifyToken(token); // throws -> handled as 401
  const user = await User.findById(decoded.id);
  if (!user) throw ApiError.unauthorized('User no longer exists');
  if (!user.isActive) throw ApiError.forbidden('This account has been disabled');

  req.user = user;
  next();
});
