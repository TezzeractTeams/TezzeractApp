import { Router } from 'express';
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

// Public routes (no authentication required for now)
router.get('/talents', getTalents);
router.get('/talents/:id', getTalentById);
router.post('/talents', createTalent);
router.put('/talents/:id', updateTalent);
router.delete('/talents/:id', deleteTalent);

// Legacy routes for backward compatibility
router.get('/candidates', getCandidates);
router.get('/jobs', getJobs);

export default router;
