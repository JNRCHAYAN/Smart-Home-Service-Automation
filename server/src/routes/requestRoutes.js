import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  create,
  getById,
  getMatches,
  confirm,
  updateStatus,
  cancel,
  reschedule,
  changeSlot,
  availability,
  myRequests,
  feedback,
  invoice
} from '../controllers/requestController.js';

// /api/requests routes: the full request lifecycle. Every route is guarded by
// requireAuth so controllers always have an identity for ownership checks.
const router = Router();

router.post('/', requireAuth, create);
router.get('/', requireAuth, myRequests);
router.get('/:id', requireAuth, getById);
router.get('/:id/matches', requireAuth, getMatches);
router.get('/:id/invoice', requireAuth, invoice);
router.post('/:id/confirm', requireAuth, confirm);
router.patch('/:id/status', requireAuth, updateStatus);
router.post('/:id/cancel', requireAuth, cancel);
router.post('/:id/reschedule', requireAuth, reschedule);
router.patch('/:id/slot', requireAuth, changeSlot);
router.get('/:id/availability', requireAuth, availability);
router.post('/:id/feedback', requireAuth, feedback);

export default router;
