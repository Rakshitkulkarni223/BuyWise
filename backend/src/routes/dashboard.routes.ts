import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/dashboard', authenticate, DashboardController.summary);
router.get('/analytics/spend', authenticate, DashboardController.spend);
router.get('/analytics/savings', authenticate, DashboardController.savings);
router.get('/insights', authenticate, DashboardController.insights);
router.get('/business-impact', authenticate, DashboardController.businessImpact);

export default router;
