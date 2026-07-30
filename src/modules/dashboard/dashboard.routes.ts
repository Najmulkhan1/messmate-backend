import { Router } from 'express';
import * as dashboardController from './dashboard.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router: Router = Router();

router.get('/summary', authenticate, dashboardController.getSummary);

export default router;
