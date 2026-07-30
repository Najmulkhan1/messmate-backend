import { Router } from 'express';
import * as dashboardController from './dashboard.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireMessAccess } from '../../middleware/rbac.middleware';

const router: Router = Router();

router.use(authenticate);
router.use(requireMessAccess);

router.get('/summary', dashboardController.getSummary);

export default router;
