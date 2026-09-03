/**
 * Wraps an async controller so rejected promises are forwarded to Express's
 * error middleware instead of crashing the process. Avoids try/catch noise.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
