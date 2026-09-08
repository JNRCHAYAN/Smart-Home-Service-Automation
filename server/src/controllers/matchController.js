import { rankProviders, recommendationReason } from '../services/matchingEngine.js';
import { activeProviders, saveCandidateMatches, requestById } from '../repo/repo.js';
import { SERVICE_CATEGORIES } from '../constants/index.js';
import { notFound, ok } from '../utils/response.js';
import { asyncHandler } from '../middleware/errorHandler.js';

/** Build the pool of genuinely relevant providers for a requested service. */
function relevantProviders(serviceType) {
  const providers = activeProviders();
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

export function computeMatches(request) {
  const pool = relevantProviders(request.serviceType);
  const maxP = maxPrice(pool, request.serviceType);
  const category = SERVICE_CATEGORIES.find((c) => c.services.includes(request.serviceType));
  const related = category ? category.services : [request.serviceType];
  const ranked = rankProviders({
    providers: pool,
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
  const request = requestById(req.params.id);
  if (!request) return notFound(res, 'Request not found');
  const matches = computeMatches(request);
  saveCandidateMatches(request._id, matches);
  return ok(res, matches, 'Top provider matches');
});
