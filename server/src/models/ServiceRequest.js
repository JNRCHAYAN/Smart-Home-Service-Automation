import mongoose from 'mongoose';

// Service request documents: what the customer wants (service, schedule,
// urgency, contact), the lifecycle status plus timeline, persisted candidate
// provider matches with scores, and optional post-completion feedback.
const candidateSchema = new mongoose.Schema(
  {
    providerId: String,
    businessName: String,
    rating: Number,
    distanceKm: Number,
    price: Number,
    serviceTypes: [String],
    score: Number,
    breakdown: mongoose.Schema.Types.Mixed,
    reason: String,
    matched: { type: Boolean, default: false }
  },
  { _id: false }
);

const timelineSchema = new mongoose.Schema(
  {
    status: String,
    timestamp: { type: Date, default: Date.now }
  },
  { _id: false }
);

const requestSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  serviceType: { type: String, required: true },
  category: String,
  location: { address: String, lat: Number, lng: Number },
  preferredDate: String,
  preferredTimeWindow: { start: String, end: String },
  urgency: { type: String, enum: ['Normal', 'Urgent', 'Emergency'], default: 'Normal' },
  problemDetails: String,
  imageUrl: String,
  contact: { name: String, phone: String },
  status: {
    type: String,
    enum: ['Requested', 'Accepted', 'On the Way', 'In Progress', 'Completed', 'Rejected', 'Cancelled'],
    default: 'Requested'
  },
  matchedProviderId: String,
  candidateMatches: [candidateSchema],
  timeline: [timelineSchema],
  feedback: { rating: Number, comment: String, createdAt: Date },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.ServiceRequest || mongoose.model('ServiceRequest', requestSchema);
