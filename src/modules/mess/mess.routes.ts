import { Router } from 'express';
import * as messController from './mess.controller';
import { validateRequest } from '../../middleware/validate-request';
import { createMessSchema, updateMessSchema } from './mess.validation';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize, requireMessAccess } from '../../middleware/rbac.middleware';

const router: Router = Router();

router.use(authenticate);

router.get('/available', messController.getAvailableMesses);
router.post('/', authorize('ADMIN', 'MANAGER'), validateRequest(createMessSchema), messController.createMess);
router.get('/me', requireMessAccess, messController.getMyMess);
router.patch('/me', authorize('MANAGER'), requireMessAccess, validateRequest(updateMessSchema), messController.updateMess);

export default router;
