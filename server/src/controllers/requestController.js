import { z } from 'zod';
import {
  createRequest,
  requestById,
  requestsByCustomer,
  confirmMatch,
  setStatus,
  cancelRequest,
  categoryForService,
  addFeedback
} from '../repo/repo.js';
import { STATUS } from '../constants/index.js';
import { ok, created, badRequest, notFound, unauthorized, forbidden } from '../utils/response.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const requestSchema = z.object({
  serviceType: z.string().min(2),
  location: z.object({
    address: z.string().optional(),
    lat: z.number(),
    lng: z.number()
  }),
  preferredDate: z.string(),
  preferredTimeWindow: z.object({ start: z.string(), end: z.string() }),
  urgency: z.enum(['Normal', 'Urgent', 'Emergency']).default('Normal'),
  problemDetails: z.string().optional(),
  imageUrl: z.string().optional(),
  contact: z.object({ name: z.string(), phone: z.string() })
});

export const create = asyncHandler(async (req, res) => {
  if (!req.currentUser) return unauthorized(res, 'Please log in to create a request');
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) return badRequest(res, parsed.error.issues[0].message);

  const data = parsed.data;
  const category = categoryForService(data.serviceType) || 'General Home Service';

  const request = createRequest({
    customerId: req.currentUser._id,
    serviceType: data.serviceType,
    category,
    location: data.location,
    preferredDate: data.preferredDate,
    preferredTimeWindow: data.preferredTimeWindow,
    urgency: data.urgency,
    problemDetails: data.problemDetails,
    imageUrl: data.imageUrl,
    contact: data.contact
  });
  return created(res, request, 'Service request created');
});

export const getById = asyncHandler(async (req, res) => {
  const request = requestById(req.params.id);
  if (!request) return notFound(res, 'Request not found');
  return ok(res, request);
});

export const getMatches = asyncHandler(async (req, res) => {
  const request = requestById(req.params.id);
  if (!request) return notFound(res, 'Request not found');
  const { getMatches: runMatches } = await import('./matchController.js');
  req.params.id = request._id;
  return runMatches(req, res);
});

export const confirm = asyncHandler(async (req, res) => {
  const { providerId } = req.body || {};
  if (!providerId) return badRequest(res, 'providerId is required');
  try {
    const request = confirmMatch(req.params.id, providerId);
    return ok(res, request, 'Provider confirmed');
  } catch (err) {
    return badRequest(res, err.message);
  }
});

export const updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  const allowed = [
    STATUS.ACCEPTED,
    STATUS.ON_THE_WAY,
    STATUS.IN_PROGRESS,
    STATUS.COMPLETED,
    STATUS.REJECTED
  ];
  if (!allowed.includes(status)) return badRequest(res, `Status must be one of ${allowed.join(', ')}`);
  try {
    const updated = setStatus(req.params.id, status, req.currentUser?._id);
    return ok(res, updated, 'Status updated');
  } catch (err) {
    return badRequest(res, err.message);
  }
});

export const cancel = asyncHandler(async (req, res) => {
  try {
    const updated = cancelRequest(req.params.id, req.currentUser._id);
    return ok(res, updated, 'Request cancelled');
  } catch (err) {
    return badRequest(res, err.message);
  }
});

export const myRequests = asyncHandler(async (req, res) => {
  if (!req.currentUser) return unauthorized(res);
  const requests = requestsByCustomer(req.currentUser._id);
  return ok(res, requests);
});

export const feedback = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body || {};
  if (!rating) return badRequest(res, 'rating is required');
  const updated = addFeedback(req.params.id, Number(rating), comment || '');
  return ok(res, updated, 'Feedback saved');
});
