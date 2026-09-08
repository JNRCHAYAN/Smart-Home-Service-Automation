// Shared domain constants for the Smart Home Service Automation platform.

export const SERVICE_CATEGORIES = [
  {
    key: 'appliance',
    label: 'Appliance & Gadget Repair',
    icon: 'wrench',
    services: ['AC Repair', 'Refrigerator Repair', 'Washing Machine Repair', 'TV Repair']
  },
  {
    key: 'plumbing',
    label: 'Plumbing',
    icon: 'droplet',
    services: ['Leak Fix', 'Pipe Repair', 'Bathroom Install', 'Water Heater Install']
  },
  {
    key: 'electrical',
    label: 'Electrical',
    icon: 'zap',
    services: ['Wiring Repair', 'Switch & Socket', 'Generator Repair', 'Inverter Install']
  },
  {
    key: 'cleaning',
    label: 'Cleaning & Pest Control',
    icon: 'sparkles',
    services: ['Deep Cleaning', 'Pest Control', 'Carpet Cleaning', 'Kitchen Cleaning']
  },
  {
    key: 'maintenance',
    label: 'Home Maintenance',
    icon: 'hammer',
    services: ['Painting', 'Carpentry', 'Tiles & Flooring', 'Woodwork']
  },
  {
    key: 'moving',
    label: 'Moving & Shifting',
    icon: 'truck',
    services: ['Home Shifting', 'Office Shifting', 'Packing', 'Transport']
  },
  {
    key: 'car',
    label: 'Car Care & Repair',
    icon: 'car',
    services: ['Car Service', 'Car Repair', 'Car Wash', 'Battery Replace']
  },
  {
    key: 'personal',
    label: 'Personal Care',
    icon: 'scissors',
    services: ['Salon at Home', 'Spa at Home', 'Grooming', 'Massage']
  }
];

export const URGENCY_LEVELS = ['Normal', 'Urgent', 'Emergency'];

export const STATUS = {
  REQUESTED: 'Requested',
  ACCEPTED: 'Accepted',
  ON_THE_WAY: 'On the Way',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled'
};

export const STATUS_FLOW = [
  STATUS.REQUESTED,
  STATUS.ACCEPTED,
  STATUS.ON_THE_WAY,
  STATUS.IN_PROGRESS,
  STATUS.COMPLETED
];

export const PROVIDER_STATUS_FLOW = [
  STATUS.ACCEPTED,
  STATUS.ON_THE_WAY,
  STATUS.IN_PROGRESS,
  STATUS.COMPLETED
];

// Matching weights, adjusted by urgency. Sum to 1.0 per row.
export const MATCH_WEIGHTS = {
  Normal: { availability: 0.2, distance: 0.2, rating: 0.25, price: 0.2, expertise: 0.15 },
  Urgent: { availability: 0.35, distance: 0.3, rating: 0.15, price: 0.1, expertise: 0.1 },
  Emergency: { availability: 0.45, distance: 0.35, rating: 0.1, price: 0.05, expertise: 0.05 }
};

// Max search radius in km used to normalise distance to a 0-1 scale.
export const MAX_SEARCH_RADIUS_KM = 15;

// Related-category credit used for partial expertise match.
export const RELATED_EXPERTISE_CREDIT = 0.6;

// Workload penalty: score multiplier per active job above the threshold.
export const WORKLOAD_PENALTY = 0.04;
export const WORKLOAD_THRESHOLD = 4;

// Dhaka areas with approximate coordinates (lat, lng).
export const AREAS = {
  Dhanmondi: { lat: 23.746, lng: 90.376 },
  Mirpur: { lat: 23.806, lng: 90.36 },
  Gulshan: { lat: 23.786, lng: 90.416 },
  Uttara: { lat: 23.876, lng: 90.389 },
  Banani: { lat: 23.793, lng: 90.405 },
  Badda: { lat: 23.785, lng: 90.425 },
  Mohammadpur: { lat: 23.766, lng: 90.355 },
  Mogbazar: { lat: 23.752, lng: 90.395 }
};
