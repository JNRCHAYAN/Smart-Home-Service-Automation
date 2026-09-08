import { Router } from 'express';
import { updateProfile, updateProviderSettings } from '../controllers/profileController.js';

// /api/profile routes: customer account/location edits and provider settings.
const router = Router();

router.put('/me', updateProfile);
router.put('/provider/settings', updateProviderSettings);

export default router;
