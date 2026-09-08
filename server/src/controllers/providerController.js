import {
  providerByUserId,
  providerDashboard,
  providerSchedule,
  setProviderAvailability
} from '../repo/repo.js';
import { ok, notFound, unauthorized, badRequest } from '../utils/response.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Provider-facing reads/updates: dashboard, schedule and availability. The same
// handlers serve both the current user's provider and an explicit provider id.
async function resolveProvider(req) {
  // Support both /api/providers/dashboard (current user, no id) and the
  // plan-aligned /api/providers/:id/dashboard forms.
  if (req.params.id) return req.params.id;
  if (!req.currentUser) return null;
  const p = await providerByUserId(req.currentUser._id);
  return p ? p._id : null;
}

export const dashboard = asyncHandler(async (req, res) => {
  const providerId = await resolveProvider(req);
  if (!providerId) return unauthorized(res, 'No provider profile for this account');
  const dash = await providerDashboard(providerId);
  if (!dash.provider) return notFound(res, 'Provider not found');
  return ok(res, dash);
});

export const schedule = asyncHandler(async (req, res) => {
  const providerId = await resolveProvider(req);
  if (!providerId) return unauthorized(res, 'No provider profile for this account');
  const s = await providerSchedule(providerId);
  return ok(res, s);
});

export const updateAvailability = asyncHandler(async (req, res) => {
  const providerId = await resolveProvider(req);
  if (!providerId) return unauthorized(res, 'No provider profile for this account');
  const { availability } = req.body || {};
  if (!Array.isArray(availability)) return badRequest(res, 'availability array required');
  const updated = await setProviderAvailability(providerId, availability);
  return ok(res, updated, 'Availability updated');
});
