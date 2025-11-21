import { Router } from 'express';
import { requireAuth } from '../middleware/supabase.middleware.js';
import {
  getDashboardAnalytics,
  getAIInsights,
  getConnectedPlatforms,
  connectPlatform,
  disconnectPlatform,
  getContentCalendar,
  schedulePost,
  updateScheduledPost,
  deleteScheduledPost,
  postNow,
  getContentSuggestions,
  handleGoogleOAuthCallback,
  handleMetaOAuthCallback,
  handleTwitterOAuthCallback,
  getGoogleAnalyticsPropertiesList,
  updateGoogleAnalyticsPropertySelection,
  getObjectives,
  createObjective,
  deleteObjective,
} from '../controllers/social.controller.js';

const router = Router();

// Dashboard analytics routes
router.get('/dashboard/analytics', requireAuth, getDashboardAnalytics);
router.get('/dashboard/insights', requireAuth, getAIInsights);

// Platform management routes
router.get('/platforms', requireAuth, getConnectedPlatforms);
router.post('/platforms/:platform/connect', requireAuth, connectPlatform);
router.delete('/platforms/:platform/disconnect', requireAuth, disconnectPlatform);

// Google Analytics property selection
router.get('/platforms/google_analytics/properties', requireAuth, getGoogleAnalyticsPropertiesList);
router.post('/platforms/google_analytics/properties/select', requireAuth, updateGoogleAnalyticsPropertySelection);

// OAuth callback routes (no auth required - called by OAuth providers)
router.get('/oauth/google/callback', handleGoogleOAuthCallback);
router.get('/oauth/meta/callback', handleMetaOAuthCallback);
router.get('/oauth/twitter/callback', handleTwitterOAuthCallback);

// Content management routes
router.get('/content/calendar', requireAuth, getContentCalendar);
router.post('/content/schedule', requireAuth, schedulePost);
router.put('/content/schedule/:id', requireAuth, updateScheduledPost);
router.delete('/content/schedule/:id', requireAuth, deleteScheduledPost);
router.post('/content/post/:id', requireAuth, postNow);
router.get('/content/suggestions', requireAuth, getContentSuggestions);

// Objectives routes
router.get('/objectives', requireAuth, getObjectives);
router.post('/objectives', requireAuth, createObjective);
router.delete('/objectives/:id', requireAuth, deleteObjective);

export default router;
