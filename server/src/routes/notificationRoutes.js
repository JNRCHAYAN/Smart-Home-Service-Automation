import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listNotifications } from '../controllers/notificationController.js';

const router = Router();

router.get('/', requireAuth, listNotifications);

export default router;
