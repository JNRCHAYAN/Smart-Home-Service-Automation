import { Router } from 'express';
import { chat, ingestKnowledge, chatHealth } from '../controllers/chatController.js';

// /api/chat routes: the assistant chat endpoint (stream or JSON), a health
// probe, and a manual trigger to (re)ingest the knowledge base into ChromaDB.
const router = Router();

router.get('/health', chatHealth);
router.post('/', chat);
router.post('/ingest', ingestKnowledge);

export default router;
