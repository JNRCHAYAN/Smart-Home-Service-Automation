import { z } from 'zod';
import {
  listUsers,
  listProviders,
  listRequests,
  updateUserAsAdmin,
  updateProviderAsAdmin,
  deleteUser,
  adminStats,
  providerByUserId
} from '../repo/repo.js';
import { ok, badRequest, notFound } from '../utils/response.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Admin API handlers: platform-wide stats, user/provider/request listings, and
// admin edits/deletes. Access is gated once at the router level (admin role).
export const stats = asyncHandler(async (req, res) => {
  return ok(res, await adminStats());
});

export const users = asyncHandler(async (req, res) => {
  const users = await listUsers();
  const result = await Promise.all(
    users.map(async (u) => {
      const provider = u.role === 'provider' ? await providerByUserId(u._id) : null;
      return { ...u, provider };
    })
  );
  return ok(res, result);
});

export const providers = asyncHandler(async (req, res) => {
  return ok(res, await listProviders());
});

export const requests = asyncHandler(async (req, res) => {
  return ok(res, await listRequests());
});

const userPatch = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().min(6).optional(),
  role: z.enum(['customer', 'provider']).optional(),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional()
});

export const updateUser = asyncHandler(async (req, res) => {
  const parsed = userPatch.safeParse(req.body);
  if (!parsed.success) return badRequest(res, parsed.error.issues[0].message);
  const b = parsed.data;
  const updated = await updateUserAsAdmin(req.params.id, {
    name: b.name,
    email: b.email || undefined,
    phone: b.phone,
    role: b.role,
    location: b.address ? { address: b.address, lat: b.lat, lng: b.lng } : undefined
  });
  if (!updated) return notFound(res, 'User not found');
  return ok(res, updated, 'User updated');
});

export const removeUser = asyncHandler(async (req, res) => {
  const removed = await deleteUser(req.params.id);
  if (!removed) return notFound(res, 'User not found');
  return ok(res, removed, 'User deleted');
});

const providerPatch = z.object({
  businessName: z.string().min(2).optional(),
  rating: z.number().min(0).max(5).optional(),
  isActive: z.boolean().optional(),
  serviceTypes: z.array(z.string()).optional(),
  pricePerService: z.record(z.number()).optional()
});

export const updateProvider = asyncHandler(async (req, res) => {
  const parsed = providerPatch.safeParse(req.body);
  if (!parsed.success) return badRequest(res, parsed.error.issues[0].message);
  const updated = await updateProviderAsAdmin(req.params.id, parsed.data);
  if (!updated) return notFound(res, 'Provider not found');
  return ok(res, updated, 'Provider updated');
});

export const services = asyncHandler(async (req, res) => {
  return ok(res, await providerById(req.params.id));
});
