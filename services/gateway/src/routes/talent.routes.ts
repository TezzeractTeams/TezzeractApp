import { Router } from 'express';
import { requireAuth } from '../middleware/supabase.middleware.js';
import { 
  getTalents,
  getTalentById,
  createTalent,
  updateTalent,
  deleteTalent,
  getCandidates,
  getJobs
} from '../controllers/talent.controller.js';

const router = Router();

// Public/optional auth routes (read operations)
router.get('/talents', getTalents);
router.get('/talents/:id', getTalentById);

// Protected routes (require authentication)
router.post('/talents', requireAuth, createTalent);
router.put('/talents/:id', requireAuth, updateTalent);
router.delete('/talents/:id', requireAuth, deleteTalent);

// Legacy routes for backward compatibility
router.get('/candidates', getCandidates);
router.get('/jobs', getJobs);

export default router;
