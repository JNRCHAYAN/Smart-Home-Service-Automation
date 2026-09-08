import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { requestsByCustomer } from '../repo/repo.js';
import { ok, unauthorized } from '../utils/response.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// /api/customers/:id/requests: a user's request history, guarded so an account
// can only read its own records.
const router = Router();

// Plan-aligned: GET /api/customers/:id/requests
router.get(
  '/:id/requests',
  requireAuth,
  asyncHandler(async (req, res) => {
    // A user may only fetch their own history unless admin (kept simple for demo).
    if (req.currentUser && req.currentUser._id !== req.params.id)
      return unauthorized(res, 'Not your requests');
    const requests = await requestsByCustomer(req.params.id);
    return ok(res, requests);
  })
);

export default router;
