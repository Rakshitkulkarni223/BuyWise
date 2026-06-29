import { Router } from 'express';
import authRoutes from './auth.routes';
import catalogRoutes from './catalog.routes';
import searchRoutes from './search.routes';
import preferenceRoutes from './preference.routes';
import historyRoutes from './history.routes';
import dashboardRoutes from './dashboard.routes';

const router = Router();

router.get('/health', (_req, res) => res.json({ success: true, status: 'ok', service: 'procureai-api' }));

router.use('/auth', authRoutes);
router.use('/', catalogRoutes);
router.use('/', searchRoutes);
router.use('/', preferenceRoutes);
router.use('/', historyRoutes);
router.use('/', dashboardRoutes);

export default router;
