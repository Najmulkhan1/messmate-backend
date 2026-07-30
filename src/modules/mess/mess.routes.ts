import { Router } from 'express';
import * as messController from './mess.controller';
import { validateRequest } from '../../middleware/validate-request';
import { createMessSchema, updateMessSchema } from './mess.validation';
import { authenticate } from '../../middleware/auth.middleware';

const router: Router = Router();

// Protect all mess routes
router.use(authenticate);

router.get('/available', messController.getAvailableMesses);
router.post('/', validateRequest(createMessSchema), messController.createMess);
router.get('/me', messController.getMyMess);
router.patch('/me', validateRequest(updateMessSchema), messController.updateMess);

export default router;
