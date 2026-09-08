import bcrypt from 'bcryptjs';
import { model, persist } from './db.js';
import { buildProviders, HERO_PROVIDER_NAME, dateOffset } from '../services/seedData.js';
import { STATUS, SERVICE_CATEGORIES } from '../constants/index.js';

const User = model('User');
const Provider = model('Provider');
const ServiceRequest = model('ServiceRequest');

function hour(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

function overlaps(sa, ea, sb, eb) {
  return sa < eb && sb < ea;
}

function maxPriceForService(providers, serviceType) {
  const prices = providers.map((p) => Number(p.pricePerService?.[serviceType]) || 0);
  return Math.max(...prices, 1);
}

// ---------------------------------------------------------------- seeding

export function ensureSeed() {
  if (User.countDocuments() > 0) return;

  const customerId = createUser({
    name: 'Aminul Rahman',
    phone: process.env.DEMO_CUSTOMER_PHONE || '01700000000',
    email: 'aminul@demo.com',
    password: process.env.DEMO_CUSTOMER_PASSWORD || 'pass1234',
    role: 'customer',
    location: { address: 'Dhanmondi, Dhaka', lat: 23.746, lng: 90.376 }
  });

  const providerUser = createUser({
    name: 'Karim Uddin',
    phone: process.env.DEMO_PROVIDER_PHONE || '01800000001',
    email: 'karim@demo.com',
    password: process.env.DEMO_PROVIDER_PASSWORD || 'pass1234',
    role: 'provider',
    location: { address: 'Dhanmondi, Dhaka', lat: 23.746, lng: 90.376 }
  });

  const providers = buildProviders(providerUser._id);
  providers.forEach((p) => Provider.create(p));
  persist();
  return { customer: User.findById(customerId._id).lean()[0], provider: providerUser };
}

// ---------------------------------------------------------------- users

export function createUser({ name, phone, email, password, role, location }) {
  const hashed = bcrypt.hashSync(password, 10);
  return User.create({ name, phone, email, password: hashed, role, location });
}

export function findUserByPhone(phone) {
  return User.findOne({ phone }).lean()[0] || null;
}

export function findUserById(id) {
  return User.findById(id).lean()[0] || null;
}

export function providerByUserId(userId) {
  return Provider.findOne({ userId }).lean()[0] || null;
}

export function createProviderProfile(userId, businessName) {
  const provider = Provider.create({
    userId,
    businessName: businessName || 'New Service Provider',
    serviceTypes: [],
    rating: 4.0,
    pricePerService: {},
    location: { address: '', lat: 23.746, lng: 90.376 },
    availability: [],
    activeJobCount: 0,
    isActive: true
  });
  persist();
  return provider;
}

export function providerById(id) {
  return Provider.findById(id).lean()[0] || null;
}

export function allProviders() {
  return Provider.find({}).lean();
}

export function activeProviders() {
  return Provider.find({ isActive: { $ne: false } }).lean();
}

export function activeProviderDocs() {
  return Provider.find({ isActive: { $ne: false } }).lean();
}

// ---------------------------------------------------------------- requests

export function createRequest(data) {
  const request = ServiceRequest.create({
    customerId: data.customerId,
    serviceType: data.serviceType,
    category: data.category,
    location: data.location,
    preferredDate: data.preferredDate,
    preferredTimeWindow: data.preferredTimeWindow,
    urgency: data.urgency,
    problemDetails: data.problemDetails,
    imageUrl: data.imageUrl,
    contact: data.contact,
    status: STATUS.REQUESTED,
    candidateMatches: [],
    timeline: [{ status: STATUS.REQUESTED, timestamp: new Date().toISOString() }]
  });
  persist();
  return request;
}

export function requestById(id) {
  return ServiceRequest.findById(id).lean()[0] || null;
}

export function requestsByCustomer(customerId) {
  return ServiceRequest.find({ customerId }).lean().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function saveCandidateMatches(requestId, matches) {
  const candidates = matches.map((m) => ({
    providerId: m.providerId,
    businessName: m.businessName,
    rating: m.rating,
    distanceKm: m.distanceKm,
    price: m.price,
    serviceTypes: m.serviceTypes,
    score: m.score,
    breakdown: m.breakdown,
    reason: m.reason,
    matched: false
  }));
  ServiceRequest.findByIdAndUpdate(requestId, { $set: { candidateMatches: candidates } });
  persist();
  return candidates;
}

export function requestMatches(requestId) {
  const req = requestById(requestId);
  return req ? req.candidateMatches : [];
}

// Double-booking guard: atomically lock a free slot for the provider.
export function lockAvailabilitySlot(providerId, request) {
  const provider = Provider.findById(providerId).lean()[0];
  if (!provider) return false;
  const reqDate = request.preferredDate;
  const rStart = hour(request.preferredTimeWindow.start);
  const rEnd = hour(request.preferredTimeWindow.end);

  const availability = provider.availability;
  let target = null;
  for (const slot of availability) {
    if (slot.isBooked) continue;
    const sStart = hour(slot.startTime);
    const sEnd = hour(slot.endTime);
    if (slot.date === reqDate && overlaps(sStart, sEnd, rStart, rEnd)) {
      target = slot;
      break;
    }
  }
  if (!target) return false;
  Provider.findByIdAndUpdate(providerId, {
    $set: {
      [`availability.${availability.indexOf(target)}.isBooked`]: true
    }
  });
  persist();
  return true;
}

export function unlockAvailabilitySlot(providerId, request) {
  const provider = Provider.findById(providerId).lean()[0];
  if (!provider) return;
  const availability = provider.availability;
  for (let i = 0; i < availability.length; i++) {
    const slot = availability[i];
    if (slot.isBooked && slot.date === request.preferredDate) {
      Provider.findByIdAndUpdate(providerId, {
        $set: { [`availability.${i}.isBooked`]: false }
      });
    }
  }
  persist();
}

export function confirmMatch(requestId, providerId) {
  const req = requestById(requestId);
  if (!req) throw new Error('Request not found');
  if (req.status !== STATUS.REQUESTED) throw new Error('Request is not awaiting confirmation');
  const ok = lockAvailabilitySlot(providerId, req);
  if (!ok) throw new Error('No available slot for the selected provider');

  ServiceRequest.findByIdAndUpdate(requestId, {
    $set: { matchedProviderId: providerId },
    $push: {
      timeline: { status: STATUS.REQUESTED, timestamp: new Date().toISOString() }
    }
  });
  persist();
  return requestById(requestId);
}

// Provider sets a new status (Accept / On the Way / In Progress / Completed / Reject).
export function setStatus(requestId, status, providerId) {
  const req = requestById(requestId);
  if (!req) throw new Error('Request not found');
  const newStatus = status;

  const patch = {
    $set: { status: newStatus },
    $push: { timeline: { status: newStatus, timestamp: new Date().toISOString() } }
  };

  if (newStatus === STATUS.ACCEPTED) {
    patch.$set.matchedProviderId = req.matchedProviderId || providerId;
    // workload: mark provider active job
    Provider.findByIdAndUpdate(patch.$set.matchedProviderId, { $inc: { activeJobCount: 1 } });
  }
  if (newStatus === STATUS.REJECTED || newStatus === STATUS.CANCELLED) {
    if (req.matchedProviderId) unlockAvailabilitySlot(req.matchedProviderId, req);
  }
  if (newStatus === STATUS.COMPLETED || newStatus === STATUS.REJECTED || newStatus === STATUS.CANCELLED) {
    if (req.matchedProviderId) {
      Provider.findByIdAndUpdate(req.matchedProviderId, { $inc: { activeJobCount: -1 } });
    }
  }

  ServiceRequest.findByIdAndUpdate(requestId, patch);
  persist();
  return requestById(requestId);
}

export function cancelRequest(requestId, customerId) {
  const req = requestById(requestId);
  if (!req) throw new Error('Request not found');
  if (req.customerId !== customerId) throw new Error('Not your request');
  if (req.matchedProviderId) unlockAvailabilitySlot(req.matchedProviderId, req);
  const updated = ServiceRequest.findByIdAndUpdate(requestId, {
    $set: { status: STATUS.CANCELLED },
    $push: { timeline: { status: STATUS.CANCELLED, timestamp: new Date().toISOString() } }
  });
  persist();
  return updated;
}

export function addFeedback(requestId, rating, comment) {
  const updated = ServiceRequest.findByIdAndUpdate(requestId, {
    $set: { feedback: { rating, comment, createdAt: new Date().toISOString() } }
  });
  persist();
  return updated;
}

// ---------------------------------------------------------------- provider views

export function providerDashboard(providerId) {
  const requests = ServiceRequest.find({ matchedProviderId: providerId }).lean();
  const incoming = requests.filter((r) => r.status === STATUS.REQUESTED);
  const active = requests.filter((r) =>
    [STATUS.ACCEPTED, STATUS.ON_THE_WAY, STATUS.IN_PROGRESS].includes(r.status)
  );
  const completed = requests.filter((r) => r.status === STATUS.COMPLETED);
  const provider = providerById(providerId);
  return {
    provider,
    counts: {
      incoming: incoming.length,
      active: active.length,
      completed: completed.length,
      activeJobCount: provider?.activeJobCount || 0
    },
    incoming,
    active,
    completed
  };
}

export function providerSchedule(providerId) {
  const provider = providerById(providerId);
  const requests = ServiceRequest.find({ matchedProviderId: providerId }).lean().sort((a, b) =>
    a.preferredDate < b.preferredDate ? -1 : 1
  );
  const bookedSlots = (provider?.availability || []).filter((s) => s.isBooked);
  const upcoming = requests.filter((r) =>
    [STATUS.REQUESTED, STATUS.ACCEPTED, STATUS.ON_THE_WAY, STATUS.IN_PROGRESS].includes(r.status)
  );
  return { provider, bookedSlots, upcoming };
}

export function setProviderAvailability(providerId, availability) {
  const updated = Provider.findByIdAndUpdate(providerId, { $set: { availability } });
  persist();
  return updated;
}

// ---------------------------------------------------------------- category helpers

export function categoryForService(serviceType) {
  const cat = SERVICE_CATEGORIES.find((c) => c.services.includes(serviceType));
  return cat ? cat.label : null;
}
