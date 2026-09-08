import mongoose from 'mongoose';

const typeMap = { usePushEach: true };

const locationSchema = new mongoose.Schema(
  {
    address: String,
    lat: Number,
    lng: Number
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: String,
    password: { type: String, required: true },
    role: { type: String, enum: ['customer', 'provider', 'admin'], required: true },
    location: locationSchema,
    createdAt: { type: Date, default: Date.now }
  },
  typeMap
);

export default mongoose.models.User || mongoose.model('User', userSchema);
