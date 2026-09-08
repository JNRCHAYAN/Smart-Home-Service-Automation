import { Router } from 'express';
import { register, login, me } from '../controllers/authController.js';

// /api/auth routes: register and login return a JWT; /me reports the token's user.
const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', me);

export default router;
