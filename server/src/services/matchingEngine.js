import {
  MATCH_WEIGHTS,
  MAX_SEARCH_RADIUS_KM,
  RELATED_EXPERTISE_CREDIT,
  WORKLOAD_PENALTY,
  WORKLOAD_THRESHOLD
} from '../constants/index.js';

/**
 * Haversine distance between two lat/lng points, in kilometres.
 * @returns {number}
 */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Convert an "HH:MM" string to minutes since midnight. */
function toMinutes(hhmm) {
  if (typeof hhmm !== 'string' || !hhmm.includes(':')) return 0;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

/** True if window A [sa, ea] overlaps window B [sb, eb]. */
function windowsOverlap(sa, ea, sb, eb) {
  return sa < eb && sb < ea;
}

/**
 * Is there an available (unbooked) slot that covers the requested date/time?
 *
 * score 1: free slot exactly on the requested date with an overlapping window.
 * score 0.5: free slot on another day near the request with overlapping window.
 * score 0: nothing available.
 * @returns {number} 0..1
 */
export function availabilityScore(provider, request) {
  const slots = Array.isArray(provider.availability) ? provider.availability : [];
  const reqDate = request.preferredDate;
  const rStart = toMinutes(request.preferredTimeWindow?.start);
  const rEnd = toMinutes(request.preferredTimeWindow?.end);

  let nearMiss = false;
  for (const slot of slots) {
    if (!slot || slot.isBooked) continue;
    const sStart = toMinutes(slot.startTime);
    const sEnd = toMinutes(slot.endTime);
    if (rEnd <= rStart || sEnd <= sStart) continue;
    if (!windowsOverlap(sStart, sEnd, rStart, rEnd)) continue;
    if (slot.date === reqDate) return 1;
    nearMiss = true;
  }
  return nearMiss ? 0.5 : 0;
}

/**
 * Similarity of the provider's service types against the requested service.
 * 1 for an exact match, partial credit for a sibling within the same category
 * (passed as `relatedServices`), 0 for no relation.
 * @param {string[]} serviceTypes provider expertise tags
 * @param {string} requestedService e.g. "AC Repair"
 * @param {string[]} [relatedServices] sibling services in the same category
 */
export function expertiseMatchScore(serviceTypes, requestedService, relatedServices = []) {
  if (!Array.isArray(serviceTypes) || serviceTypes.length === 0) return 0;
  const normalized = serviceTypes.map((s) => String(s).trim().toLowerCase());
  const target = String(requestedService || '')
    .trim()
    .toLowerCase();
  if (!target) return 0;
  if (normalized.includes(target)) return 1;
  // Partial credit for a sibling service in the same category.
  if (Array.isArray(relatedServices)) {
    const related = relatedServices.map((s) => String(s).trim().toLowerCase());
    if (normalized.some((s) => related.includes(s))) return RELATED_EXPERTISE_CREDIT;
  }
  // Fallback: any service sharing a leading word counts as related.
  const targetWord = target.split(' ')[0];
  if (normalized.some((s) => s.startsWith(targetWord) || targetWord.startsWith(s))) {
    return RELATED_EXPERTISE_CREDIT;
  }
  return 0;
}

/** Distance normalised to a 0-1 scale (closer is better, so invert). */
function normalizedDistanceScore(metersOrKm) {
  const km = metersOrKm;
  const clamped = Math.max(0, Math.min(km, MAX_SEARCH_RADIUS_KM));
  return 1 - clamped / MAX_SEARCH_RADIUS_KM;
}

/** Inverted normalised price: cheapest within category scores highest. */
function normalizedPriceScore(price, maxPrice) {
  if (!price || !maxPrice) return 0.5;
  const clamped = Math.max(0, Math.min(price, maxPrice));
  return 1 - clamped / maxPrice;
}

/** Workload multiplier: overworked providers are penalised. */
function workloadMultiplier(provider) {
  const active = Number(provider.activeJobCount) || 0;
  if (active <= WORKLOAD_THRESHOLD) return 1;
  return Math.max(0.4, 1 - (active - WORKLOAD_THRESHOLD) * WORKLOAD_PENALTY);
}

/** Resolve the price bid by a provider for the requested service type. */
function providerPrice(provider, requestedService) {
  const map = provider.pricePerService || {};
  return Number(map[requestedService]) || 0;
}

/**
 * Score all candidate providers against a request and return the top N with a
 * transparent breakdown. Pure: no DB, no side effects.
 *
 * @param {Object} opts
 * @param {Array} opts.providers list of provider objects
 * @param {Object} opts.request request shape ({ serviceType, location, preferredDate, ... })
 * @param {number} opts.maxPrice maximum price within the requested category
 * @param {string[]} [opts.relatedServices] sibling services in the requested category
 * @param {number} [opts.limit=3] how many to return
 * @returns {Array<{provider, score, breakdown, distanceKm}>}
 */
export function rankProviders({ providers, request, maxPrice, relatedServices = [], limit = 3 }) {
  const weights = MATCH_WEIGHTS[request.urgency] || MATCH_WEIGHTS.Normal;

  const scored = providers
    .filter((p) => p && p.isActive !== false)
    .map((provider) => {
      const distKm = haversineKm(
        request.location.lat,
        request.location.lng,
        provider.location.lat,
        provider.location.lng
      );

      const rawAvailability = availabilityScore(provider, request);
      const expertise = expertiseMatchScore(provider.serviceTypes, request.serviceType, relatedServices);
      const price = providerPrice(provider, request.serviceType);
      const distanceScore = normalizedDistanceScore(distKm);
      const priceScore = normalizedPriceScore(price, maxPrice);
      const ratingScore = Math.max(0, Math.min(Number(provider.rating) || 0, 5)) / 5;

      const workload = workloadMultiplier(provider);

      // Availability is a hard gate: an unavailable provider cannot be recommended.
      if (rawAvailability === 0) return { provider, score: -1, breakdown: null, distanceKm: distKm };

      let score =
        weights.availability * rawAvailability +
        weights.distance * distanceScore +
        weights.rating * ratingScore +
        weights.price * priceScore +
        weights.expertise * expertise;

      score *= workload;

      return {
        provider,
        score: Math.round(score * 1000) / 1000,
        breakdown: {
          score,
          availability: rawAvailability,
          distance: distanceScore,
          rating: ratingScore,
          price: priceScore,
          expertise,
          distanceKm: Math.round(distKm * 100) / 100
        },
        distanceKm: Math.round(distKm * 100) / 100
      };
    })
    .filter((r) => r.score >= 0)
    .sort((x, y) => y.score - x.score);

  return scored.slice(0, limit);
}

/**
 * Build a human readable "why recommended" string from a score breakdown.
 * Used on the customer-facing match cards.
 * @returns {string}
 */
export function recommendationReason(breakdown, provider) {
  if (!breakdown) return 'Unavailable for your slot.';
  const parts = [];
  if (breakdown.expertise >= 1) parts.push('exact expertise match');
  else if (breakdown.expertise > 0) parts.push('related expertise');
  if (breakdown.availability >= 1) parts.push('free in your window');
  else if (breakdown.availability === 0.5) parts.push('near your window');
  if (breakdown.distanceKm <= 3) parts.push(`only ${breakdown.distanceKm} km away`);
  else parts.push(`${breakdown.distanceKm} km away`);
  if (Number(provider.rating || 0) >= 4.6) parts.push('highly rated');
  if (parts.length === 0) return 'Best overall match.';
  return parts.join(' • ');
}
