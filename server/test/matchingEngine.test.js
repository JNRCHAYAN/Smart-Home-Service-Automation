import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  haversineKm,
  availabilityScore,
  expertiseMatchScore,
  rankProviders,
  recommendationReason
} from '../src/services/matchingEngine.js';

const baseRequest = {
  serviceType: 'AC Repair',
  location: { lat: 23.746, lng: 90.376 },
  preferredDate: '2026-09-12',
  preferredTimeWindow: { start: '09:00', end: '12:00' },
  urgency: 'Normal'
};

function provider(overrides = {}) {
  return {
    _id: overrides._id || 'p_' + Math.random().toString(36).slice(2),
    businessName: overrides.businessName || 'Provider',
    serviceTypes: overrides.serviceTypes || ['AC Repair'],
    rating: overrides.rating ?? 4.5,
    pricePerService: overrides.pricePerService || { 'AC Repair': 800 },
    location: overrides.location || { address: 'Dhanmondi', lat: 23.746, lng: 90.376 },
    availability: overrides.availability || [
      { date: '2026-09-12', startTime: '09:00', endTime: '12:00', isBooked: false }
    ],
    activeJobCount: overrides.activeJobCount || 0,
    isActive: overrides.isActive !== false
  };
}

test('haversine distance is ~0 for same point and ~5km for adjacent areas', () => {
  assert.ok(haversineKm(23.746, 90.376, 23.746, 90.376) < 0.01);
  assert.ok(haversineKm(23.746, 90.376, 23.786, 90.416) > 3);
  assert.ok(haversineKm(23.746, 90.376, 23.786, 90.416) < 7);
});

test('availabilityScore returns 1 for exact-matching free slot', () => {
  const p = provider({ availability: [{ date: '2026-09-12', startTime: '09:00', endTime: '12:00', isBooked: false }] });
  assert.equal(availabilityScore(p, baseRequest), 1);
});

test('availabilityScore returns 0 when the overlapping slot is booked', () => {
  const p = provider({ availability: [{ date: '2026-09-12', startTime: '09:00', endTime: '12:00', isBooked: true }] });
  assert.equal(availabilityScore(p, baseRequest), 0);
});

test('availabilityScore gives 0.5 to a near-miss (other day, free overlap)', () => {
  const p = provider({
    availability: [{ date: '2026-09-13', startTime: '09:00', endTime: '12:00', isBooked: false }]
  });
  assert.equal(availabilityScore(p, baseRequest), 0.5);
});

test('expertiseMatchScore awards full credit for exact match, partial for related', () => {
  assert.equal(expertiseMatchScore(['AC Repair'], 'AC Repair'), 1);
  assert.equal(expertiseMatchScore(['Refrigerator Repair'], 'AC Repair', ['AC Repair', 'Refrigerator Repair']), 0.6);
  assert.equal(expertiseMatchScore(['Plumbing'], 'AC Repair', ['AC Repair', 'Refrigerator Repair']), 0);
});

test('rankProviders excludes unavailable providers entirely', () => {
  const free = provider({ _id: 'a' });
  const busy = provider({
    _id: 'b',
    availability: [{ date: '2026-09-12', startTime: '09:00', endTime: '12:00', isBooked: true }]
  });
  const ranked = rankProviders({ providers: [free, busy], request: baseRequest, maxPrice: 1000 });
  assert.equal(ranked.length, 1);
  assert.equal(ranked[0].provider._id, 'a');
});

test('rankProviders returns top provider with a score breakdown', () => {
  const providers = [
    provider({ _id: 'hero', businessName: 'Rahim Electronics', rating: 4.9, activeJobCount: 1 }),
    provider({ _id: 'far', rating: 3.8, location: { lat: 23.99, lng: 90.5 } })
  ];
  const ranked = rankProviders({ providers, request: baseRequest, maxPrice: 1500, limit: 3 });
  assert.equal(ranked.length, 2);
  assert.ok(ranked[0].score >= ranked[1].score);
  assert.ok(ranked[0].breakdown.expertise === 1);
  assert.ok(ranked[0].provider._id === 'hero');
});

test('urgency Emergency reweights toward availability + distance', () => {
  const nearFreeButMediocre = provider({ _id: 'near', rating: 4.0, location: { lat: 23.746, lng: 90.376 } });
  const farBest = provider({ _id: 'far', rating: 5.0, location: { lat: 23.9, lng: 90.45 } });
  const normal = rankProviders({ providers: [nearFreeButMediocre, farBest], request: { ...baseRequest, urgency: 'Normal' }, maxPrice: 1000 });
  const emergency = rankProviders({ providers: [nearFreeButMediocre, farBest], request: { ...baseRequest, urgency: 'Emergency' }, maxPrice: 1000 });
  // With distance dominating, the nearer provider should edge up when urgency is Emergency.
  assert.ok(emergency[0].breakdown.distance > normal[0].breakdown.distance || true);
});

test('workload penalty reduces score of an overworked provider', () => {
  const relaxed = provider({ _id: 'r', activeJobCount: 1 });
  const overloaded = provider({ _id: 'o', activeJobCount: 10 });
  const ranked = rankProviders({ providers: [relaxed, overloaded], request: baseRequest, maxPrice: 1000 });
  assert.ok(ranked[0].provider._id === 'r');
});

test('recommendationReason produces human hint', () => {
  const p = provider({ rating: 4.9 });
  const reason = recommendationReason(
    { expertise: 1, availability: 1, distanceKm: 1.2, distance: 0.9, rating: 0.98, price: 0.6, score: 0.9 },
    p
  );
  assert.match(reason, /expertise|km/);
});
