import { Router } from 'express';
import * as notificationController from './notification.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requireMessAccess } from '../../middleware/rbac.middleware';

const router: Router = Router();

router.use(authenticate);
router.use(requireMessAccess);

router.get('/', notificationController.getNotifications);
router.patch('/:id/read', notificationController.markAsRead);

export default router;
