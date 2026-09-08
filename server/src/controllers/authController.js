import { z } from 'zod';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import env from '../config/env.js';
import {
  findUserByPhone,
  findUserByEmail,
  createUser,
  createProviderProfile,
  providerByUserId
} from '../repo/repo.js';
import { ok, created, badRequest, unauthorized } from '../utils/response.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Auth handlers: register enforces phone/email uniqueness before creating the
// user, login verifies the bcrypt hash, and both issue a 2-day JWT carrying the
// user id and role; /me echoes the token's user.
function tokenFor(user) {
  // Payload = user id (sub) plus role, so downstream code knows the actor; the
  // auth middleware later resolves sub to the full user document.
  return jwt.sign({ sub: user._id, role: user.role }, env.jwtSecret, { expiresIn: '2d' });
}

function publicUser(user) {
  return {
    _id: user._id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role: user.role,
    location: user.location
  };
}

const registerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(6),
  password: z.string().min(4),
  email: z.string().email().optional().or(z.literal('')),
  role: z.enum(['customer', 'provider']),
  location: z
    .object({ address: z.string().optional(), lat: z.number().optional(), lng: z.number().optional() })
    .optional(),
  businessName: z.string().optional()
});

export const register = asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return badRequest(res, parsed.error.issues[0].message);
  const data = parsed.data;

  // Phone and email both act as unique identity keys, so a duplicate is rejected
  // here (rather than upserted) before the user record is created.
  if (await findUserByPhone(data.phone)) return badRequest(res, 'This phone number is already registered');
  if (data.email && (await findUserByEmail(data.email)))
    return badRequest(res, 'This email is already registered');

  const user = await createUser({
    name: data.name,
    phone: data.phone,
    email: data.email ? data.email.toLowerCase() : undefined,
    password: data.password,
    role: data.role,
    location: data.location
  });

  let provider = null;
  if (data.role === 'provider') {
    provider = await createProviderProfile(user._id, data.businessName || data.name);
  }

  return created(res, { token: tokenFor(user), user: publicUser(user), provider });
});

export const login = asyncHandler(async (req, res) => {
  const { phone, password } = req.body || {};
  if (!phone || !password) return badRequest(res, 'Phone and password are required');

  const user = await findUserByPhone(phone);
  if (!user) return unauthorized(res, 'Invalid phone or password');

  // Validate the submitted password against the bcrypt hash stored at register.
  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) return unauthorized(res, 'Invalid phone or password');

  const provider = user.role === 'provider' ? await providerByUserId(user._id) : null;
  return ok(res, { token: tokenFor(user), user: publicUser(user), provider });
});

export const me = asyncHandler(async (req, res) => {
  if (!req.currentUser) return unauthorized(res);
  const provider = req.currentUser.role === 'provider' ? await providerByUserId(req.currentUser._id) : null;
  return ok(res, { user: publicUser(req.currentUser), provider });
});
