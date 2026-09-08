import {
  rankProviders,
  recommendationReason,
  availabilityScore,
  availableSlotsSuggestions
} from '../services/matchingEngine.js';
import {
  activeProviders,
  saveCandidateMatches,
  requestById,
  activeJobCountsMap
} from '../repo/repo.js';
import { SERVICE_CATEGORIES } from '../constants/index.js';
import { notFound, ok, unauthorized } from '../utils/response.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Match endpoints: compute the top provider candidates for a service request
// via the matching engine and persist them on the request for later comparison
// and confirmation. Only providers with a genuinely free slot on the requested
// date/time are recommended; if none are free, /availability offers the next
// windows where relevant providers are actually available.
/** Build the pool of genuinely relevant providers for a requested service. */
async function relevantProviders(serviceType) {
  const providers = await activeProviders();
  const category = SERVICE_CATEGORIES.find((c) => c.services.includes(serviceType));
  const related = category ? category.services : [serviceType];
  return providers.filter((p) => {
    const types = (p.serviceTypes || []).map((s) => s.toLowerCase());
    return related.some((s) => types.includes(s.toLowerCase()));
  });
}

function maxPrice(providers, serviceType) {
  const prices = providers.map((p) => Number(p.pricePerService?.[serviceType]) || 0);
  return Math.max(...prices, 1);
}

export async function computeMatches(request, excludeId) {
  let pool = (await relevantProviders(request.serviceType)).map((p) => ({ ...p }));
  if (excludeId) pool = pool.filter((p) => p._id !== excludeId);
  const workload = await activeJobCountsMap();
  for (const p of pool) p.activeJobCount = workload[p._id] || 0;

  // Hard gate: only recommend providers free in the requested slot. Providers
  // free on a different day (near-miss) are deliberately excluded here — the
  // availability score keeps its 0.5 near-miss branch for the standalone engine
  // tests, but the live matching flow must not offer unverifiable providers.
  const freeNow = pool.filter((p) => availabilityScore(p, request) >= 1);

  const maxP = maxPrice(freeNow, request.serviceType);
  const category = SERVICE_CATEGORIES.find((c) => c.services.includes(request.serviceType));
  const related = category ? category.services : [request.serviceType];
  const ranked = rankProviders({
    providers: freeNow,
    request,
    maxPrice: maxP,
    relatedServices: related,
    limit: 3
  });
  return ranked.map((r) => ({
    providerId: r.provider._id,
    businessName: r.provider.businessName,
    rating: r.provider.rating,
    distanceKm: r.distanceKm,
    price: r.provider.pricePerService?.[request.serviceType] || 0,
    serviceTypes: r.provider.serviceTypes,
    score: r.score,
    breakdown: r.breakdown,
    reason: recommendationReason(r.breakdown, r.provider)
  }));
}

export const getMatches = asyncHandler(async (req, res) => {
  const request = await requestById(req.params.id);
  if (!request) return notFound(res, 'Request not found');
  // After a reschedule, exclude the previously assigned (rejected) provider.
  const wasRescheduled = (request.timeline || []).some((t) => t.status === 'Rescheduled');
  const excludeId = wasRescheduled ? request.matchedProviderId : null;
  const matches = await computeMatches(request, excludeId);
  await saveCandidateMatches(request._id, matches);
  return ok(res, matches, 'Top provider matches');
});

/**
 * Next-available windows when nothing matches the requested slot: returns the
 * soonest (date, time range) windows in which a relevant provider is actually
 * free, so the customer can pick one and re-match.
 */
export const getAvailability = asyncHandler(async (req, res) => {
  const request = await requestById(req.params.id);
  if (!request) return notFound(res, 'Request not found');
  if (
    String(request.customerId) !== String(req.currentUser?._id) &&
    req.currentUser?.role !== 'admin'
  ) {
    return unauthorized(res, 'Not your request');
  }
  const pool = await relevantProviders(request.serviceType);
  const suggestions = availableSlotsSuggestions({ providers: pool, request, limit: 6 });
  return ok(res, suggestions, 'Alternative time slots');
});
