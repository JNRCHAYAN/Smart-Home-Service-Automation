import { chromaRag } from './chromaRag.js';
import { SERVICE_CATEGORIES, MATCH_WEIGHTS, STATUS, URGENCY_LEVELS, AREAS } from '../constants/index.js';
import { buildProviders, HERO_PROVIDER_NAME } from './seedData.js';

// Knowledge-base ingestion for RAG: builds static documents (platform overview,
// matching algorithm, pricing, policies, Bangla keywords...) plus per-service
// and per-provider documents, embeds them, and adds them to the ChromaDB store.
const KNOWLEDGE_DOCS = [
  {
    id: 'platform_overview',
    content: `Servio is a Smart Home Service Automation platform that connects customers with verified service providers for home services in Dhaka, Bangladesh. 

Services offered:
- Appliance & Gadget Repair (AC Repair, Refrigerator Repair, Washing Machine Repair, TV Repair)
- Plumbing (Leak Fix, Pipe Repair, Bathroom Install, Water Heater Install)
- Electrical (Wiring Repair, Switch & Socket, Generator Repair, Inverter Install)
- Cleaning & Pest Control (Deep Cleaning, Pest Control, Carpet Cleaning, Kitchen Cleaning)
- Home Maintenance (Painting, Carpentry, Tiles & Flooring, Woodwork)
- Moving & Shifting (Home Shifting, Office Shifting, Packing, Transport)
- Car Care & Repair (Car Service, Car Repair, Car Wash, Battery Replace)
- Personal Care (Salon at Home, Spa at Home, Grooming, Massage)

The platform uses a Smart Provider Matching Engine that ranks providers by expertise, availability, distance, rating, and price with weights adjusted by urgency level.`,
    metadata: { type: 'platform', category: 'overview' }
  },
  {
    id: 'matching_algorithm',
    content: `Smart Provider Matching Engine Algorithm:

The matching score is calculated as a weighted sum of normalized factors (0-1 scale):

score = w_availability * availabilityScore
      + w_distance * (1 - normalizedDistance)
      + w_rating * (rating / 5)
      + w_price * (1 - normalizedPrice)
      + w_expertise * expertiseMatchScore

Urgency-adjusted weights:
- Normal: availability=0.20, distance=0.20, rating=0.25, price=0.20, expertise=0.15
- Urgent: availability=0.35, distance=0.30, rating=0.15, price=0.10, expertise=0.10
- Emergency: availability=0.45, distance=0.35, rating=0.10, price=0.05, expertise=0.05

Key behaviors:
- Availability is a hard gate - providers with no free slots are never recommended
- Near-miss credit - providers free on nearby days score 0.5 availability
- Double-booking guard - confirming a provider atomically locks the slot
- Workload balancing - providers above 4 active jobs are scored down by 0.04 per job
- Transparent results - every match includes per-factor breakdown and "why we picked this" hint

Max search radius: 15km for distance normalization.`,
    metadata: { type: 'algorithm', category: 'matching' }
  },
  {
    id: 'booking_process',
    content: `Booking Process for Customers:

1. Select Service Category & Type
   - Choose from 8 categories with 30+ service types
   - Each maps to providers with matching expertise tags

2. Provide Details
   - Location (area in Dhaka with auto-filled coordinates)
   - Problem description (free text)
   - Optional image upload

3. Schedule & Urgency
   - Preferred date (today or future)
   - Time window (morning/afternoon/evening slots)
   - Urgency level: Normal / Urgent / Emergency
   - Emergency prioritizes speed & closest provider over price

4. Confirm & Match
   - System returns top 3 ranked providers with score breakdown
   - Customer confirms one provider
   - Slot is locked atomically (no double-booking)
   - Request status: Requested → Accepted → On the Way → In Progress → Completed

5. Track & Feedback
   - Live status tracker with timeline
   - Rate & review after completion`,
    metadata: { type: 'process', category: 'booking' }
  },
  {
    id: 'provider_dashboard',
    content: `Provider Dashboard Features:

Providers can:
- View incoming requests (matched to their skills/location)
- Accept or reject jobs with one tap
- Update job status: Accepted → On the Way → In Progress → Completed
- View scheduled jobs in calendar/list view
- Manage availability slots (date, start time, end time)
- See earnings and performance metrics
- View customer details for accepted jobs

Provider matching considers:
- Service type expertise (exact match = 1.0, related = 0.6)
- Availability for requested date/time window
- Distance from customer (within 15km radius)
- Rating (0-5 scale)
- Price competitiveness
- Current workload (active job count)`,
    metadata: { type: 'provider', category: 'dashboard' }
  },
  {
    id: 'urgency_levels',
    content: `Urgency Levels & Behavior:

Normal (Default):
- Standard matching weights
- Provider has 2+ hours to respond
- Price weighted normally (20%)

Urgent:
- Higher availability weight (35%) - prioritizes free providers
- Higher distance weight (30%) - prioritizes closer providers
- Lower price weight (10%) - price less important
- Provider expected to respond within 1 hour

Emergency:
- Highest availability weight (45%) - only immediately available providers
- Highest distance weight (35%) - closest providers prioritized
- Minimal price weight (5%) - price nearly irrelevant
- Provider expected to respond within 30 minutes
- Queue jumping - emergency requests shown first to providers`,
    metadata: { type: 'urgency', category: 'booking' }
  },
  {
    id: 'pricing_guide',
    content: `Pricing Guide (BDT - Bangladeshi Taka):

Appliance Repair:
- AC Repair: ৳800-1100
- Refrigerator Repair: ৳900-1200
- Washing Machine Repair: ৳700-1000
- TV Repair: ৳600-900

Plumbing:
- Leak Fix: ৳500-750
- Pipe Repair: ৳600-800
- Bathroom Install: ৳4000-4500
- Water Heater Install: ৳1800-2200

Electrical:
- Wiring Repair: ৳550-700
- Switch & Socket: ৳350-400
- Generator Repair: ৳1200-1500
- Inverter Install: ৳2200-2500

Cleaning:
- Deep Cleaning: ৳2200-2500
- Kitchen Cleaning: ৳1200-1500
- Carpet Cleaning: ৳1500-1800
- Pest Control: ৳1500-1800

Moving:
- Home Shifting: ৳5500-6000
- Office Shifting: ৳8000+
- Packing: ৳1500
- Transport: ৳3000

Car Care:
- Car Service: ৳1800-2000
- Car Repair: ৳2500+
- Car Wash: ৳500
- Battery Replace: ৳900

Personal Care:
- Salon at Home: ৳1000-1200
- Spa at Home: ৳2000
- Grooming: ৳600-700
- Massage: ৳1500-2000

Note: Prices vary by provider, location, and complexity.`,
    metadata: { type: 'pricing', category: 'general' }
  },
  {
    id: 'areas_covered',
    content: `Service Areas in Dhaka (with coordinates):

- Dhanmondi (23.746, 90.376) - Central, dense residential/commercial
- Mirpur (23.806, 90.360) - North-west, large residential
- Gulshan (23.786, 90.416) - Diplomatic zone, upscale
- Uttara (23.876, 90.389) - North, planned residential
- Banani (23.793, 90.405) - Commercial/residential, near Gulshan
- Badda (23.785, 90.425) - East, growing area
- Mohammadpur (23.766, 90.355) - Central-west, dense
- Mogbazar (23.752, 90.395) - Central, near Dhanmondi

Maximum service radius: 15km from provider location.
Providers typically serve 2-3 adjacent areas.`,
    metadata: { type: 'areas', category: 'general' }
  },
  {
    id: 'faq_general',
    content: `Frequently Asked Questions:

Q: How do I book a service?
A: Use the "New Request" wizard or chat with our AI assistant. Select service, provide details, choose time, confirm provider.

Q: How are providers matched?
A: Our Smart Matching Engine ranks providers by availability, distance, rating, price, and expertise with weights based on urgency.

Q: Can I reschedule?
A: Yes, you can reschedule via chat or the tracking page if the provider hasn't started yet.

Q: What if no providers are available?
A: Try adjusting your date/time window or choosing a different service type. Emergency requests search wider.

Q: How do I track my request?
A: Go to "My Requests" or use the tracking link. Status updates in real-time: Requested → Accepted → On the Way → In Progress → Completed.

Q: How do I pay?
A: Payment is handled directly with the provider after service completion (cash/card/bKash/Nagad).

Q: What if I'm not satisfied?
A: You can rate 1-5 stars and leave feedback. For disputes, contact support.

Q: How do I become a provider?
A: Register as a provider, complete your profile with services, pricing, and availability.`,
    metadata: { type: 'faq', category: 'general' }
  },
  {
    id: 'faq_provider',
    content: `Provider FAQs:

Q: How do I get requests?
A: Enable your availability and ensure your service types match. Requests appear in "Incoming" tab.

Q: What happens if I accept then can't make it?
A: You can reject, but it affects your rating. Better to update availability in advance.

Q: How is my rating calculated?
A: Average of customer ratings (1-5 stars) after completed jobs.

Q: Can I set my own prices?
A: Yes, set price per service type in your profile.

Q: How do I update my schedule?
A: Go to Schedule page, add/remove time slots for each day.

Q: What is active job count?
A: Number of jobs currently Accepted/On the Way/In Progress. Affects matching (workload balancing).

Q: How do I get paid?
A: Directly from customers after job completion. Platform doesn't handle payments.`,
    metadata: { type: 'faq', category: 'provider' }
  },
  {
    id: 'cancellation_policy',
    content: `Cancellation & Refund Policy:

Customer Cancellation:
- Free cancellation if >2 hours before scheduled time
- 50% fee if <2 hours before (paid to provider for blocked slot)
- No refund if provider already "On the Way"

Provider Cancellation:
- If provider rejects after accepting: penalty on rating
- If provider cancels "On the Way"/"In Progress": account review
- System auto-re-matches customer to next best provider

Emergency Jobs:
- Cancellation fee applies immediately upon confirmation
- Provider no-show: full refund + priority re-match

Disputes:
- Contact support with evidence (photos, chat logs)
- Resolution within 24-48 hours
- Platform decision is final`,
    metadata: { type: 'policy', category: 'cancellation' }
  },
  {
    id: 'bangla_keywords',
    content: `বাংলা কিওয়ার্ড ও সাহায্য (Bangla Keywords & Help):

সার্ভিস বুক করুন: "আমার AC ঠিক করতে হবে", "প্লাম্বিং সমস্যা", "বাসা শিফটিং লাগবে"
লোকেশন: "ধানমন্ডি", "মিরপুর", "গুলশান", "উত্তরা", "বনানী"
জরুরি: "জরুরি", "এমার্জেন্সি", "অবিলম্বে"
ট্র্যাক করুন: "আমার রিকোয়েস্ট কোথায়", "প্রোভাইডার কখন আসবে"
রেটিং দিন: "রেটিং দিব", "ফিডব্যাক লিখব"

উপলব্ধ সার্ভিস ক্যাটাগরি:
- এসি রিপেয়ার (AC Repair)
- ফ্রিজ রিপেয়ার (Refrigerator Repair)
- প্লাম্বিং (Plumbing)
- ইলেকট্রিক্যাল (Electrical)
- ক্লিনিং (Cleaning)
- বাসা শিফটিং (Moving)
- কার সার্ভিস (Car Service)
- স্যালুন অ্যাট হোম (Salon at Home)

দাম অনুমান: "এসি রিপেয়ার কত টাকা?", "ডিপ ক্লিনিং খরচ"
প্রোভাইডার খুঁজুন: "আমার কাছাকাছি প্লাম্বার কে?", "সেরা এসি মिस्त্রি"`,
    metadata: { type: 'bangla', category: 'language' }
  }
];

async function ingestAllKnowledge() {
  console.log('🔄 Starting knowledge base ingestion...');

  await chromaRag.ensureCollection();

  // Add static knowledge documents
  const staticDocs = KNOWLEDGE_DOCS.map((doc) => ({
    content: doc.content,
    metadata: { ...doc.metadata, docId: doc.id }
  }));

  await chromaRag.addDocuments(staticDocs);
  console.log(`✅ Added ${staticDocs.length} static knowledge documents`);

  // Add service categories
  const categoryDocs = SERVICE_CATEGORIES.flatMap((cat) =>
    cat.services.map((service) => ({
      content: `Service: ${service}
Category: ${cat.label} (${cat.key})
Icon: ${cat.icon}
Available in areas: ${Object.keys(AREAS).join(', ')}
Typical price range: Check provider pricing for ${service}`,
      metadata: {
        type: 'service',
        category: cat.key,
        serviceType: service,
        categoryLabel: cat.label
      }
    }))
  );

  await chromaRag.addDocuments(categoryDocs);
  console.log(`✅ Added ${categoryDocs.length} service documents`);

  // Add provider profiles (sample - in production, fetch from DB)
  const sampleProviders = buildProviders('hero-user-id');
  const providerDocs = sampleProviders.map((p) => ({
    content: `Provider: ${p.businessName}
Services: ${p.serviceTypes.join(', ')}
Rating: ${p.rating}/5.0
Location: ${p.location.address}
Price per service: ${JSON.stringify(p.pricePerService)}
Availability: ${p.availability.length} slots over 7 days
Active jobs: ${p.activeJobCount}`,
    metadata: {
      type: 'provider',
      businessName: p.businessName,
      serviceTypes: p.serviceTypes,
      rating: p.rating,
      area: p.location.address.split(',')[0],
      activeJobCount: p.activeJobCount
    }
  }));

  await chromaRag.addDocuments(providerDocs);
  console.log(`✅ Added ${providerDocs.length} provider documents`);

  console.log('🎉 Knowledge base ingestion complete!');
}

export { ingestAllKnowledge, KNOWLEDGE_DOCS };
