import { Router } from 'express';
import { HistoryController } from '../controllers/HistoryController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/history', authenticate, HistoryController.list);
router.delete('/history/:id', authenticate, HistoryController.remove);

export default router;
