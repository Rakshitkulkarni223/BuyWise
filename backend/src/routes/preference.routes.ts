import { Router } from 'express';
import { PreferenceController } from '../controllers/PreferenceController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/preferences', authenticate, PreferenceController.get);
router.put('/preferences', authenticate, PreferenceController.update);
router.get('/weight-profiles', authenticate, PreferenceController.weightProfiles);

export default router;
