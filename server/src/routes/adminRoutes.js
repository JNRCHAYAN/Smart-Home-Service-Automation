import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  stats,
  users,
  providers,
  requests,
  updateUser,
  removeUser,
  updateProvider
} from '../controllers/adminController.js';

// /api/admin routes. A single router-level guard requires an authenticated
// admin, so none of the individual handlers repeat the role check.
const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/stats', stats);
router.get('/users', users);
router.get('/providers', providers);
router.get('/requests', requests);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', removeUser);
router.patch('/providers/:id', updateProvider);

export default router;
