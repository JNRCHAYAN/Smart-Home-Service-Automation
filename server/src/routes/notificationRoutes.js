import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { listNotifications } from '../controllers/notificationController.js';

// /api/notifications: the current user's activity feed (auth required).
const router = Router();

router.get('/', requireAuth, listNotifications);

export default router;
