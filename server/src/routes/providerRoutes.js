import { Router } from 'express';
import { dashboard, schedule, updateAvailability } from '../controllers/providerController.js';

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
