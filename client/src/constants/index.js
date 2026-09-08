// Shared domain constants: urgency levels and their Badge/bar tones, the
// canonical status list + STATUS_FLOW ordering, time windows, Dhaka areas and
// the service-category icon map.

// Semantic badge/tone variants — see design-system/servio/MASTER.md
export const URGENCY_LEVELS = ['Normal', 'Urgent', 'Emergency'];

export const URGENCY_VARIANTS = {
  Normal: 'neutral',
  Urgent: 'warning',
  Emergency: 'danger'
};

export const URGENCY_BAR = {
  Normal: 'bg-success',
  Urgent: 'bg-warning',
  Emergency: 'bg-danger'
};

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

// STATUS_VARIANTS maps each lifecycle status to a Badge variant name; helpers
// in utils/format.js consume it via statusClass().
export const STATUS_VARIANTS = {
  [STATUS.REQUESTED]: 'neutral',
  [STATUS.ACCEPTED]: 'success',
  [STATUS.ON_THE_WAY]: 'warning',
  [STATUS.IN_PROGRESS]: 'info',
  [STATUS.COMPLETED]: 'success',
  [STATUS.REJECTED]: 'danger',
  [STATUS.CANCELLED]: 'neutral'
};

export const TIME_WINDOWS = [
  { label: '09:00 – 12:00', start: '09:00', end: '12:00' },
  { label: '12:00 – 15:00', start: '12:00', end: '15:00' },
  { label: '15:00 – 18:00', start: '15:00', end: '18:00' },
  { label: '18:00 – 21:00', start: '18:00', end: '21:00' }
];

export const DHK_AREAS = [
  { label: 'Dhanmondi', lat: 23.746, lng: 90.376 },
  { label: 'Mirpur', lat: 23.806, lng: 90.36 },
  { label: 'Gulshan', lat: 23.786, lng: 90.416 },
  { label: 'Uttara', lat: 23.876, lng: 90.389 },
  { label: 'Banani', lat: 23.793, lng: 90.405 },
  { label: 'Badda', lat: 23.785, lng: 90.425 },
  { label: 'Mohammadpur', lat: 23.766, lng: 90.355 },
  { label: 'Mogbazar', lat: 23.752, lng: 90.395 }
];

export const CATEGORY_ICONS = {
  appliance: 'wrench',
  plumbing: 'droplet',
  electrical: 'zap',
  cleaning: 'sparkles',
  maintenance: 'hammer',
  moving: 'truck',
  car: 'car',
  personal: 'scissors'
};
