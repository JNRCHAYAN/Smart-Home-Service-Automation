import { AREAS } from '../constants/index.js';

/** Return an ISO date string (YYYY-MM-DD) offset by `offset` days. */
export function dateOffset(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

/**
 * Build a default availability array covering the next 7 days with a couple of
 * windows. Some slots are pre-booked to exercise the availability logic.
 */
function defaultAvailability({ fullyBooked = false, windowCount = 3 } = {}) {
  const slots = [];
  const windows = [
    ['09:00', '12:00'],
    ['12:00', '15:00'],
    ['15:00', '18:00']
  ];
  for (let day = 0; day < 7; day++) {
    const date = dateOffset(day);
    for (let w = 0; w < windowCount; w++) {
      const [startTime, endTime] = windows[w];
      // Pre-book some slots to demonstrate the availability filter.
      const isBooked = fullyBooked || (day === 1 && w === 1) || (day === 3 && w === 0);
      slots.push({ date, startTime, endTime, isBooked });
    }
  }
  return slots;
}

function makeProvider(o) {
  const area = AREAS[o.area];
  return {
    userId: o.userId || null,
    businessName: o.businessName,
    serviceTypes: o.serviceTypes,
    rating: o.rating,
    pricePerService: o.pricePerService,
    location: { address: `${o.area}, Dhaka`, lat: area.lat, lng: area.lng },
    availability: o.availability || defaultAvailability(o),
    activeJobCount: o.activeJobCount || 0,
    isActive: o.isActive !== false
  };
}

/** The hero provider that embodies the demo's "obvious best match" scenario. */
export const HERO_PROVIDER_NAME = 'Rahim Electronics';

export function buildProviders(heroUserId) {
  const providers = [
    makeProvider({
      userId: heroUserId,
      businessName: HERO_PROVIDER_NAME,
      serviceTypes: ['AC Repair', 'Refrigerator Repair', 'Electrical'],
      rating: 4.9,
      area: 'Dhanmondi',
      pricePerService: { 'AC Repair': 800, 'Refrigerator Repair': 900, Electrical: 700 },
      activeJobCount: 1,
      availability: defaultAvailability({ fullyBooked: false })
    }),
    makeProvider({
      businessName: 'Dhaka AC Care',
      serviceTypes: ['AC Repair', 'AC Install'],
      rating: 4.7,
      area: 'Dhanmondi',
      pricePerService: { 'AC Repair': 950, 'AC Install': 1500 },
      activeJobCount: 2
    }),
    makeProvider({
      businessName: 'Cool Tech Services',
      serviceTypes: ['AC Repair', 'TV Repair'],
      rating: 4.3,
      area: 'Mohammadpur',
      pricePerService: { 'AC Repair': 1100, 'TV Repair': 600 },
      activeJobCount: 3
    }),
    makeProvider({
      businessName: 'Greenline Cooling',
      serviceTypes: ['AC Repair', 'AC Install', 'Electrical'],
      rating: 4.5,
      area: 'Mirpur',
      pricePerService: { 'AC Repair': 850, 'AC Install': 1400, Electrical: 650 },
      activeJobCount: 2
    }),
    makeProvider({
      businessName: 'Blue Nile Plumbing',
      serviceTypes: ['Leak Fix', 'Pipe Repair', 'Bathroom Install'],
      rating: 4.8,
      area: 'Gulshan',
      pricePerService: { 'Leak Fix': 600, 'Pipe Repair': 700, 'Bathroom Install': 4000 },
      activeJobCount: 1
    }),
    makeProvider({
      businessName: 'Prime Pipe Works',
      serviceTypes: ['Leak Fix', 'Pipe Repair'],
      rating: 4.2,
      area: 'Uttara',
      pricePerService: { 'Leak Fix': 500, 'Pipe Repair': 650 },
      activeJobCount: 4
    }),
    makeProvider({
      businessName: 'AquaFix Plumbing',
      serviceTypes: ['Pipe Repair', 'Water Heater Install', 'Bathroom Install'],
      rating: 4.6,
      area: 'Banani',
      pricePerService: { 'Pipe Repair': 750, 'Water Heater Install': 1800, 'Bathroom Install': 4500 },
      activeJobCount: 2
    }),
    makeProvider({
      businessName: 'Spark Volt Electrical',
      serviceTypes: ['Wiring Repair', 'Switch & Socket', 'Inverter Install'],
      rating: 4.9,
      area: 'Dhanmondi',
      pricePerService: { 'Wiring Repair': 700, 'Switch & Socket': 400, 'Inverter Install': 2500 },
      activeJobCount: 1
    }),
    makeProvider({
      businessName: 'Current Electricals',
      serviceTypes: ['Wiring Repair', 'Switch & Socket', 'Generator Repair'],
      rating: 4.4,
      area: 'Mirpur',
      pricePerService: { 'Wiring Repair': 550, 'Switch & Socket': 350, 'Generator Repair': 1200 },
      activeJobCount: 3
    }),
    makeProvider({
      businessName: 'Diganto Electrical',
      serviceTypes: ['Inverter Install', 'Generator Repair'],
      rating: 4.1,
      area: 'Uttara',
      pricePerService: { 'Inverter Install': 2200, 'Generator Repair': 1300 },
      activeJobCount: 0
    }),
    makeProvider({
      businessName: 'Shine Cleaners',
      serviceTypes: ['Deep Cleaning', 'Kitchen Cleaning', 'Carpet Cleaning'],
      rating: 4.8,
      area: 'Gulshan',
      pricePerService: { 'Deep Cleaning': 2500, 'Kitchen Cleaning': 1200, 'Carpet Cleaning': 1500 },
      activeJobCount: 2
    }),
    makeProvider({
      businessName: 'Sparkle & Shine',
      serviceTypes: ['Deep Cleaning', 'Pest Control'],
      rating: 4.5,
      area: 'Banani',
      pricePerService: { 'Deep Cleaning': 2200, 'Pest Control': 1800 },
      activeJobCount: 1
    }),
    makeProvider({
      businessName: 'PestGuard BD',
      serviceTypes: ['Pest Control'],
      rating: 4.6,
      area: 'Mohammadpur',
      pricePerService: { 'Pest Control': 1500 },
      activeJobCount: 3
    }),
    makeProvider({
      businessName: 'CraftMen Carpentry',
      serviceTypes: ['Painting', 'Carpentry', 'Tiles & Flooring'],
      rating: 4.7,
      area: 'Badda',
      pricePerService: { Painting: 3000, Carpentry: 2000, 'Tiles & Flooring': 4500 },
      activeJobCount: 2
    }),
    makeProvider({
      businessName: 'Artisan Homeworks',
      serviceTypes: ['Painting', 'Woodwork'],
      rating: 4.3,
      area: 'Dhanmondi',
      pricePerService: { Painting: 3500, Woodwork: 2500 },
      activeJobCount: 1
    }),
    makeProvider({
      businessName: 'EziMove Relocation',
      serviceTypes: ['Home Shifting', 'Packing', 'Transport'],
      rating: 4.9,
      area: 'Gulshan',
      pricePerService: { 'Home Shifting': 6000, Packing: 1500, Transport: 3000 },
      activeJobCount: 1
    }),
    makeProvider({
      businessName: 'SwiftMove Dhaka',
      serviceTypes: ['Home Shifting', 'Office Shifting'],
      rating: 4.4,
      area: 'Uttara',
      pricePerService: { 'Home Shifting': 5500, 'Office Shifting': 8000 },
      activeJobCount: 2
    }),
    makeProvider({
      businessName: 'AutoCare Garage',
      serviceTypes: ['Car Service', 'Car Repair', 'Battery Replace'],
      rating: 4.8,
      area: 'Mirpur',
      pricePerService: { 'Car Service': 1800, 'Car Repair': 2500, 'Battery Replace': 900 },
      activeJobCount: 3
    }),
    makeProvider({
      businessName: 'Dhaka Motors Care',
      serviceTypes: ['Car Service', 'Car Wash'],
      rating: 4.5,
      area: 'Banani',
      pricePerService: { 'Car Service': 2000, 'Car Wash': 500 },
      activeJobCount: 1
    }),
    makeProvider({
      businessName: 'Glow Salon At Home',
      serviceTypes: ['Salon at Home', 'Grooming', 'Spa at Home'],
      rating: 4.9,
      area: 'Dhanmondi',
      pricePerService: { 'Salon at Home': 1200, Grooming: 700, 'Spa at Home': 2000 },
      activeJobCount: 0
    }),
    makeProvider({
      businessName: 'Urban Barbers',
      serviceTypes: ['Salon at Home', 'Grooming'],
      rating: 4.6,
      area: 'Gulshan',
      pricePerService: { 'Salon at Home': 1000, Grooming: 600 },
      activeJobCount: 2
    })
  ];

  return providers;
}
