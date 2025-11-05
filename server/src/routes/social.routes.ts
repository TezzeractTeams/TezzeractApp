import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { getPlatforms, getAnalytics } from '../controllers/social.controller.js';

const router = Router();

// All social routes require authentication
router.use(authenticateToken);

router.get('/platforms', getPlatforms);
router.get('/analytics', getAnalytics);

export default router;

