import { Router } from 'express';
import { requireAuth, optionalAuth } from '../middleware/supabase.middleware.js';
import { handleTalentChat, swapTalent, listGeminiModels } from '../controllers/aiTalentSearch.controller.js';

const router = Router();

// List available Gemini models (no auth required for debugging)
router.get('/models', listGeminiModels);

// AI chat endpoint - optional auth (allows unauthenticated access)
router.post('/chat', optionalAuth, handleTalentChat);

// Protect swap talent endpoint
router.post('/swap', requireAuth, swapTalent);

export default router;


