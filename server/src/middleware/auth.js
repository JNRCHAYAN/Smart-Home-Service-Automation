import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { findUserById } from '../repo/repo.js';
import { unauthorized, forbidden } from '../utils/response.js';

// Auth middleware. Runs globally: it verifies the optional Bearer JWT and sets
// req.currentUser, leaving anonymous requests untouched. requireAuth and
// requireRole below enforce access where a route needs it.

/** Attach the authenticated user to req.currentUser (mock JWT auth). */
export async function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch (_err) {
    /* invalid token — continue as anonymous */
    return next();
  }
  try {
    const user = await findUserById(payload.sub);
    if (user) req.currentUser = user;
  } catch (err) {
    return next(err);
  }
  return next();
}

/** Require any authenticated user. */
export function requireAuth(req, res, next) {
  if (!req.currentUser) return unauthorized(res, 'Please log in to continue');
  return next();
}

/** Require a specific role. */
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.currentUser) return unauthorized(res, 'Please log in to continue');
    if (req.currentUser.role !== role) return forbidden(res, `Requires ${role} role`);
    return next();
  };
}
