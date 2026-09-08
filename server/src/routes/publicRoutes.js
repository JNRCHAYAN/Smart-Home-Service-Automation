import { Router } from 'express';
import { SERVICE_CATEGORIES } from '../constants/index.js';
import { activeProviders } from '../repo/repo.js';
import { ok } from '../utils/response.js';
import { asyncHandler } from '../middleware/errorHandler.js';

// Public (no-auth) browsing routes mounted at /api: the service catalogue and
// the list of currently active providers.
const router = Router();

router.get('/services', (req, res) => ok(res, SERVICE_CATEGORIES, 'Service categories'));
router.get(
  '/providers',
  asyncHandler(async (req, res) => ok(res, await activeProviders(), 'Providers'))
);

export default router;
