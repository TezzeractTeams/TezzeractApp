import { Router } from 'express';
import { requireAuth } from '../middleware/clerk.middleware.js';
import {
  getDashboardAnalytics,
  getAIInsights,
  getConnectedPlatforms,
  connectPlatform,
  disconnectPlatform,
  getContentCalendar,
  schedulePost,
  getContentSuggestions,
} from '../controllers/social.controller.js';

const router = Router();

// Dashboard analytics routes
router.get('/dashboard/analytics', requireAuth, getDashboardAnalytics);
router.get('/dashboard/insights', requireAuth, getAIInsights);

// Platform management routes
router.get('/platforms', requireAuth, getConnectedPlatforms);
router.post('/platforms/:platform/connect', requireAuth, connectPlatform);
router.delete('/platforms/:platform/disconnect', requireAuth, disconnectPlatform);

// Content management routes
router.get('/content/calendar', requireAuth, getContentCalendar);
router.post('/content/schedule', requireAuth, schedulePost);
router.get('/content/suggestions', requireAuth, getContentSuggestions);

export default router;
