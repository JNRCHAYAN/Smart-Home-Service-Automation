import { Router } from 'express';
import { dashboard, schedule, updateAvailability } from '../controllers/providerController.js';

const router = Router();

router.get('/dashboard', dashboard);
router.get('/schedule', schedule);
router.patch('/availability', updateAvailability);

export default router;
