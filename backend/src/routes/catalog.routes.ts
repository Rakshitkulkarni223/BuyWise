import { Router } from 'express';
import { CatalogController } from '../controllers/CatalogController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/categories', authenticate, CatalogController.listCategories);
router.get('/categories/:id/suppliers', authenticate, CatalogController.suppliersForCategory);
router.get('/suppliers', authenticate, CatalogController.listSuppliers);
router.patch('/suppliers/:id', authenticate, CatalogController.toggleSupplier);

export default router;
