import { 
  createRequest, 
  requestById, 
  requestsByCustomer, 
  saveCandidateMatches, 
  confirmMatch, 
  setStatus, 
  cancelRequest, 
  addFeedback,
  providerDashboard,
  providerSchedule,
  setProviderAvailability,
  providerByUserId,
  activeProviders
} from '../repo/repo.js';
import { STATUS, URGENCY_LEVELS, SERVICE_CATEGORIES, AREAS } from '../constants/index.js';
import { chromaRag } from './chromaRag.js';
import { githubModels } from './githubModels.js';
import { rankProviders } from './matchingEngine.js';

export const CHAT_FUNCTIONS = [
  {
    type: 'function',
    function: {
      name: 'search_services',
      description: 'Search for available service types and categories. Use when user asks what services are offered or wants to browse categories.',
      parameters: {
        type: 'object',
        properties: {
          category: { type: 'string', description: 'Optional category key (appliance, plumbing, electrical, cleaning, maintenance, moving, car, personal)' },
          query: { type: 'string', description: 'User search query in English or Bangla' }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_service_request',
      description: 'Create a new service request for a customer. Use when user wants to book a service. Requires: serviceType, location (area), preferredDate, preferredTimeWindow (start, end), urgency, problemDetails, contact (name, phone).',
      parameters: {
        type: 'object',
        properties: {
          serviceType: { type: 'string', description: 'Exact service type from categories (e.g., "AC Repair", "Leak Fix")' },
          category: { type: 'string', description: 'Category key (appliance, plumbing, etc.)' },
          location: {
            type: 'object',
            properties: {
              address: { type: 'string' },
              lat: { type: 'number' },
              lng: { type: 'number' }
            },
            required: ['address', 'lat', 'lng']
          },
          preferredDate: { type: 'string', description: 'YYYY-MM-DD format' },
          preferredTimeWindow: {
            type: 'object',
            properties: { start: { type: 'string' }, end: { type: 'string' } },
            required: ['start', 'end']
          },
          urgency: { type: 'string', enum: ['Normal', 'Urgent', 'Emergency'] },
          problemDetails: { type: 'string' },
          contact: {
            type: 'object',
            properties: { name: { type: 'string' }, phone: { type: 'string' } },
            required: ['name', 'phone']
          }
        },
        required: ['serviceType', 'category', 'location', 'preferredDate', 'preferredTimeWindow', 'urgency', 'problemDetails', 'contact']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_provider_matches',
      description: 'Get ranked provider matches for a request ID. Returns top 3 providers with score breakdown.',
      parameters: {
        type: 'object',
        properties: {
          requestId: { type: 'string', description: 'Request ID from create_service_request' }
        },
        required: ['requestId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'confirm_provider_match',
      description: 'Confirm a provider for a request (locks their slot).',
      parameters: {
        type: 'object',
        properties: {
          requestId: { type: 'string' },
          providerId: { type: 'string' }
        },
        required: ['requestId', 'providerId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_request_status',
      description: 'Get live status and tracking info for a request.',
      parameters: {
        type: 'object',
        properties: {
          requestId: { type: 'string' }
        },
        required: ['requestId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'cancel_request',
      description: 'Cancel a service request.',
      parameters: {
        type: 'object',
        properties: {
          requestId: { type: 'string' }
        },
        required: ['requestId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'submit_feedback',
      description: 'Submit rating and feedback for a completed request.',
      parameters: {
        type: 'object',
        properties: {
          requestId: { type: 'string' },
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          comment: { type: 'string' }
        },
        required: ['requestId', 'rating']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_provider_dashboard',
      description: 'Get provider dashboard with incoming, active, completed jobs and counts.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_job_status',
      description: 'Update job status (provider only): Accept, On the Way, In Progress, Complete, Reject.',
      parameters: {
        type: 'object',
        properties: {
          requestId: { type: 'string' },
          status: { type: 'string', enum: ['Accepted', 'On the Way', 'In Progress', 'Completed', 'Rejected'] }
        },
        required: ['requestId', 'status']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_provider_schedule',
      description: 'Get provider schedule with upcoming jobs and available slots.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'update_provider_availability',
      description: 'Update provider availability slots.',
      parameters: {
        type: 'object',
        properties: {
          availability: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                date: { type: 'string' },
                startTime: { type: 'string' },
                endTime: { type: 'string' },
                isBooked: { type: 'boolean' }
              },
              required: ['date', 'startTime', 'endTime']
            }
          }
        },
        required: ['availability']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_knowledge_base',
      description: 'Search the knowledge base for FAQs, policies, pricing, how matching works, etc. Use for informational questions.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query in English or Bangla' },
          nResults: { type: 'integer', default: 5 }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'estimate_price',
      description: 'Get price estimate for a service type in an area.',
      parameters: {
        type: 'object',
        properties: {
          serviceType: { type: 'string' },
          area: { type: 'string' }
        },
        required: ['serviceType']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_user_requests',
      description: 'Get customer request history.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  }
];

export async function executeFunction(name, args, userContext) {
  try {
    switch (name) {
      case 'search_services':
        return await handleSearchServices(args);
      case 'create_service_request':
        return await handleCreateRequest(args, userContext);
      case 'get_provider_matches':
        return await handleGetMatches(args);
      case 'confirm_provider_match':
        return await handleConfirmMatch(args);
      case 'get_request_status':
        return await handleGetStatus(args);
      case 'cancel_request':
        return await handleCancel(args, userContext);
      case 'submit_feedback':
        return await handleFeedback(args);
      case 'get_provider_dashboard':
        return await handleProviderDashboard(userContext);
      case 'update_job_status':
        return await handleUpdateStatus(args, userContext);
      case 'get_provider_schedule':
        return await handleProviderSchedule(userContext);
      case 'update_provider_availability':
        return await handleUpdateAvailability(args, userContext);
      case 'search_knowledge_base':
        return await handleKnowledgeSearch(args);
      case 'estimate_price':
        return await handlePriceEstimate(args);
      case 'get_user_requests':
        return await handleUserRequests(userContext);
      default:
        return { error: `Unknown function: ${name}` };
    }
  } catch (error) {
    console.error(`Function ${name} error:`, error);
    return { error: error.message };
  }
}

async function handleSearchServices({ category, query }) {
  let services = SERVICE_CATEGORIES;
  if (category) {
    services = services.filter(c => c.key === category);
  }
  
  if (query) {
    const q = query.toLowerCase();
    services = services.map(cat => ({
      ...cat,
      services: cat.services.filter(s => s.toLowerCase().includes(q))
    })).filter(cat => cat.services.length > 0);
  }
  
  return { services, areas: Object.keys(AREAS) };
}

async function handleCreateRequest(args, userContext) {
  if (!userContext?.userId) {
    return { error: 'User not authenticated' };
  }
  
  const payload = {
    customerId: userContext.userId,
    ...args
  };
  
  const request = createRequest(payload);
  
  // Run matching engine to find providers
  const providers = activeProviders();
  const matches = rankProviders({ providers, request, limit: 3 });
  const topMatches = matches.slice(0, 3);
  
  saveCandidateMatches(request._id, topMatches);
  
  return { 
    requestId: request._id, 
    message: 'Request created successfully. Finding best providers...',
    request,
    matches: topMatches
  };
}

async function handleGetMatches({ requestId }) {
  const request = requestById(requestId);
  if (!request) return { error: 'Request not found' };
  
  const matches = request.candidateMatches || [];
  return { matches };
}

async function handleConfirmMatch({ requestId, providerId }) {
  try {
    const result = confirmMatch(requestId, providerId);
    return { 
      success: true, 
      message: 'Provider confirmed! Slot locked.',
      request: result
    };
  } catch (error) {
    return { error: error.message };
  }
}

async function handleGetStatus({ requestId }) {
  const request = requestById(requestId);
  if (!request) return { error: 'Request not found' };
  return { request };
}

async function handleCancel({ requestId }, userContext) {
  try {
    const result = cancelRequest(requestId, userContext?.userId);
    return { success: true, message: 'Request cancelled', request: result };
  } catch (error) {
    return { error: error.message };
  }
}

async function handleFeedback({ requestId, rating, comment }) {
  const result = addFeedback(requestId, rating, comment);
  return { success: true, message: 'Feedback submitted', request: result };
}

async function handleProviderDashboard(userContext) {
  if (!userContext?.userId || userContext.role !== 'provider') {
    return { error: 'Provider access required' };
  }
  
  const provider = providerByUserId(userContext.userId);
  if (!provider) return { error: 'Provider profile not found' };
  
  const dashboard = providerDashboard(provider._id);
  return { dashboard };
}

async function handleUpdateStatus({ requestId, status }, userContext) {
  if (!userContext?.userId || userContext.role !== 'provider') {
    return { error: 'Provider access required' };
  }
  
  const provider = providerByUserId(userContext.userId);
  if (!provider) return { error: 'Provider profile not found' };
  
  try {
    const result = setStatus(requestId, status, provider._id);
    return { success: true, message: `Job ${status.toLowerCase()}`, request: result };
  } catch (error) {
    return { error: error.message };
  }
}

async function handleProviderSchedule(userContext) {
  if (!userContext?.userId || userContext.role !== 'provider') {
    return { error: 'Provider access required' };
  }
  
  const provider = providerByUserId(userContext.userId);
  if (!provider) return { error: 'Provider profile not found' };
  
  const schedule = providerSchedule(provider._id);
  return { schedule };
}

async function handleUpdateAvailability({ availability }, userContext) {
  if (!userContext?.userId || userContext.role !== 'provider') {
    return { error: 'Provider access required' };
  }
  
  const provider = providerByUserId(userContext.userId);
  if (!provider) return { error: 'Provider profile not found' };
  
  const result = setProviderAvailability(provider._id, availability);
  return { success: true, message: 'Availability updated', availability: result };
}

async function handleKnowledgeSearch({ query, nResults = 5 }) {
  const results = await chromaRag.hybridSearch(query, nResults);
  
  const documents = results.documents?.[0] || [];
  const metadatas = results.metadatas?.[0] || [];
  
  return {
    results: documents.map((doc, i) => ({
      content: doc,
      metadata: metadatas[i]
    }))
  };
}

async function handlePriceEstimate({ serviceType, area }) {
  const results = await chromaRag.hybridSearch(`price ${serviceType} ${area || ''}`, 3);
  const documents = results.documents?.[0] || [];
  
  return {
    serviceType,
    area: area || 'Any',
    estimates: documents.map(d => d.content).slice(0, 2)
  };
}

async function handleUserRequests(userContext) {
  if (!userContext?.userId || userContext.role !== 'customer') {
    return { error: 'Customer access required' };
  }
  
  const requests = requestsByCustomer(userContext.userId);
  return { requests };
}