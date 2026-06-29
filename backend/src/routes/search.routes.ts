import { Router } from 'express';
import { SearchController } from '../controllers/SearchController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/search', authenticate, SearchController.search);
router.post('/recommendations', authenticate, SearchController.recommend);

export default router;
