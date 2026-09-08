import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  create,
  getById,
  getMatches,
  confirm,
  updateStatus,
  cancel,
  myRequests,
  feedback
} from '../controllers/requestController.js';

const router = Router();

router.post('/', requireAuth, create);
router.get('/', requireAuth, myRequests);
router.get('/:id', requireAuth, getById);
router.get('/:id/matches', requireAuth, getMatches);
router.post('/:id/confirm', requireAuth, confirm);
router.patch('/:id/status', requireAuth, updateStatus);
router.post('/:id/cancel', requireAuth, cancel);
router.post('/:id/feedback', requireAuth, feedback);

export default router;
