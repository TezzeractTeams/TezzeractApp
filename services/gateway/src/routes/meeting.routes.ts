import { Router } from 'express';
import { requireAuth } from '../middleware/supabase.middleware.js';
import { bookMeeting } from '../controllers/meeting.controller.js';

const router = Router();

// Book a meeting (requires authentication)
router.post('/book', requireAuth, bookMeeting);

export default router;
