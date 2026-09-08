import { Router } from 'express';
import { SERVICE_CATEGORIES } from '../constants/index.js';
import { activeProviders } from '../repo/repo.js';
import { ok } from '../utils/response.js';

const router = Router();

router.get('/services', (req, res) => ok(res, SERVICE_CATEGORIES, 'Service categories'));
router.get('/providers', (req, res) => ok(res, activeProviders(), 'Providers'));

export default router;
