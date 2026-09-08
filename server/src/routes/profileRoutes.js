import { Router } from 'express';
import { updateProfile, updateProviderSettings } from '../controllers/profileController.js';

const router = Router();

router.put('/me', updateProfile);
router.put('/provider/settings', updateProviderSettings);

export default router;
