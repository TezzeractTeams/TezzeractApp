import { Router } from 'express';
import { requireAuth } from '../middleware/supabase.middleware.js';
import { handleTalentChat } from '../controllers/aiTalentSearch.controller.js';

const router = Router();

// Protect AI chat endpoint
router.post('/chat', requireAuth, handleTalentChat);

export default router;


