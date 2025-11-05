import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { getChannels, getMessages } from '../controllers/chat.controller.js';

const router = Router();

// All chat routes require authentication
router.use(authenticateToken);

router.get('/channels', getChannels);
router.get('/messages/:channelId', getMessages);

export default router;

