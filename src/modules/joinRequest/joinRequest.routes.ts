import { Router } from 'express';
import * as joinRequestController from './joinRequest.controller';
import { validateRequest } from '../../middleware/validate-request';
import { sendRequestSchema, handleRequestSchema } from './joinRequest.validation';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize, requireMessAccess } from '../../middleware/rbac.middleware';

const router: Router = Router();

router.use(authenticate);

router.post('/', validateRequest(sendRequestSchema), joinRequestController.sendRequest);
router.get('/pending', requireMessAccess, authorize('MANAGER'), joinRequestController.getPendingRequests);
router.patch('/:id/accept', requireMessAccess, authorize('MANAGER'), validateRequest(handleRequestSchema), joinRequestController.acceptRequest);
router.patch('/:id/reject', requireMessAccess, authorize('MANAGER'), validateRequest(handleRequestSchema), joinRequestController.rejectRequest);

export default router;
