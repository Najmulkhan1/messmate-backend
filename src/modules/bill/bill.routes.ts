import { Router } from 'express';
import * as billController from './bill.controller';
import { validateRequest } from '../../middleware/validate-request';
import { generateBillSchema } from './bill.validation';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize, requireMessAccess } from '../../middleware/rbac.middleware';

const router: Router = Router();

router.use(authenticate);
router.use(requireMessAccess);

router.post('/generate', authorize('MANAGER'), validateRequest(generateBillSchema), billController.generateBill);
router.get('/', billController.getBills);

export default router;
