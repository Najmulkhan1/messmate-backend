import { Router } from 'express';
import * as adminController from './admin.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/rbac.middleware';

const router: Router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

router.get('/stats', adminController.getStats);
router.get('/analytics', adminController.getAnalytics);
router.get('/settings', adminController.getSettings);
router.patch('/settings', adminController.updateSettings);

router.get('/users', adminController.getUsers);
router.get('/users/:userId', adminController.getUserById);
router.patch('/users/:userId/ban', adminController.banUser);
router.patch('/users/:userId/unban', adminController.unbanUser);
router.patch('/users/:userId/promote', adminController.promoteToAdmin);
router.delete('/users/:userId', adminController.deleteUser);

router.get('/messes', adminController.getMesses);
router.get('/messes/:messId', adminController.getMessById);
router.delete('/messes/:messId', adminController.deleteMess);
router.patch('/messes/:messId/transfer', adminController.transferMess);

export default router;
