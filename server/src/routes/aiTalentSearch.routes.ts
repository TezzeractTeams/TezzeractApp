import { Router } from 'express';
import { handleTalentChat } from '../controllers/aiTalentSearch.controller.js';

const router = Router();

router.post('/chat', handleTalentChat);

export default router;


