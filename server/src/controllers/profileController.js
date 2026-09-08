import { z } from 'zod';
import { updateUser, updateProviderInfo, providerByUserId } from '../repo/repo.js';
import { ok, badRequest, unauthorized, notFound } from '../utils/response.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { SERVICE_CATEGORIES } from '../constants/index.js';

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional()
});

export const updateProfile = asyncHandler(async (req, res) => {
  if (!req.currentUser) return unauthorized(res);
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) return badRequest(res, parsed.error.issues[0].message);
  const body = parsed.data;
  const user = await updateUser(req.currentUser._id, {
    name: body.name,
    email: body.email || undefined,
    location: body.address || body.lat ? { address: body.address, lat: body.lat, lng: body.lng } : undefined
  });
  return ok(res, user, 'Profile updated');
});

const providerSettingsSchema = z.object({
  businessName: z.string().min(2).optional(),
  serviceTypes: z.array(z.string()).optional(),
  pricePerService: z.record(z.number()).optional(),
  isActive: z.boolean().optional()
});

export const updateProviderSettings = asyncHandler(async (req, res) => {
  if (!req.currentUser) return unauthorized(res);
  if (req.currentUser.role !== 'provider') return badRequest(res, 'Provider account required');
  const parsed = providerSettingsSchema.safeParse(req.body);
  if (!parsed.success) return badRequest(res, parsed.error.issues[0].message);
  const provider = await providerByUserId(req.currentUser._id);
  if (!provider) return notFound(res, 'Provider profile not found');
  const updated = await updateProviderInfo(provider._id, parsed.data);
  return ok(res, updated, 'Provider settings updated');
});

export const categoryServices = asyncHandler(async (req, res) => {
  return ok(res, SERVICE_CATEGORIES);
});
