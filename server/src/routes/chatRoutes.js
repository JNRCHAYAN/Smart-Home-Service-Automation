import { Router } from 'express';
import { chat, ingestKnowledge, chatHealth } from '../controllers/chatController.js';

const router = Router();

router.get('/health', chatHealth);
router.post('/', chat);
router.post('/ingest', ingestKnowledge);

export default router;