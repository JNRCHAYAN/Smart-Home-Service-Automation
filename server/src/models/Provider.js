import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema(
  {
    date: String,
    startTime: String,
    endTime: String,
    isBooked: { type: Boolean, default: false }
  },
  { _id: false }
);

const providerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  businessName: { type: String, required: true },
  serviceTypes: [String],
  rating: Number,
  pricePerService: { type: Map, of: Number },
  location: { address: String, lat: Number, lng: Number },
  availability: [availabilitySchema],
  activeJobCount: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
});

export default mongoose.models.Provider || mongoose.model('Provider', providerSchema);
