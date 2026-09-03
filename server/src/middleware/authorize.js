import { ApiError } from '../utils/ApiError.js';

/**
 * Role-based authorization. Use after `authenticate`.
 * Example: router.post('/', authenticate, authorize(ROLES.ADMIN), handler)
 */
export function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Required role: ${allowedRoles.join(' or ')}`
        )
      );
    }
    return next();
  };
}
