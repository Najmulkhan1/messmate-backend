import { Router } from 'express';
import * as joinRequestController from './joinRequest.controller';
import { validateRequest } from '../../middleware/validate-request';
import { sendRequestSchema, handleRequestSchema } from './joinRequest.validation';
import { authenticate } from '../../middleware/auth.middleware';

const router: Router = Router();

router.use(authenticate);

router.post('/', validateRequest(sendRequestSchema), joinRequestController.sendRequest);
router.get('/pending', joinRequestController.getPendingRequests);
router.patch('/:id/accept', validateRequest(handleRequestSchema), joinRequestController.acceptRequest);
router.patch('/:id/reject', validateRequest(handleRequestSchema), joinRequestController.rejectRequest);

export default router;
