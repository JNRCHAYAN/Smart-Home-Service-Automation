import { fail } from '../utils/response.js';

// Terminal middleware: asyncHandler forwards rejected async handlers to Express;
// notFoundHandler and errorHandler turn unknown routes and thrown errors into
// the uniform error response shape.
export function notFoundHandler(req, res) {
  return fail(res, 404, `Route not found: ${req.method} ${req.originalUrl}`);
}

export function errorHandler(err, req, res, _next) {
  console.error('[error]', err);
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  return fail(res, status, message);
}

export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
