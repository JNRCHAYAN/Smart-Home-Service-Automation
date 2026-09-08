import { Router } from 'express';
import { dashboard, schedule, updateAvailability } from '../controllers/providerController.js';

// /api/providers routes. The same handlers are exposed twice: for the current
// user (no id) and keyed by an explicit provider id (plan-aligned URLs).
const router = Router();

// Current user (no id)
router.get('/dashboard', dashboard);
router.get('/schedule', schedule);
router.patch('/availability', updateAvailability);

// Plan-aligned: explicit provider id
router.get('/:id/dashboard', dashboard);
router.get('/:id/schedule', schedule);
router.patch('/:id/availability', updateAvailability);

export default router;
