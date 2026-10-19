import { Router } from 'express';
import { requireAuth } from '../middleware/supabase.middleware.js';
import { getOrganization, createOrganization, updateOrganization } from '../controllers/organization.controller.js';

const router = Router();

// All organization routes require authentication
router.get('/', requireAuth, getOrganization);
router.post('/', requireAuth, createOrganization);
router.put('/', requireAuth, updateOrganization);

export default router;

