import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { getCandidates, getJobs } from '../controllers/talent.controller.js';

const router = Router();

// All talent routes require authentication
router.use(authenticateToken);

router.get('/candidates', getCandidates);
router.get('/jobs', getJobs);

export default router;

