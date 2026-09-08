import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import { findUserById } from '../repo/repo.js';
import { unauthorized, forbidden } from '../utils/response.js';

/** Attach the authenticated user to req.currentUser (mock JWT auth). */
export function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next();
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    const user = findUserById(payload.sub);
    if (user) req.currentUser = user;
  } catch (_err) {
    /* invalid token — continue as anonymous */
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
