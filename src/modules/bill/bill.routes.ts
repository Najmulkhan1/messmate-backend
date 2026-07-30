import { Router } from 'express';
import * as billController from './bill.controller';
import { validateRequest } from '../../middleware/validate-request';
import { generateBillSchema } from './bill.validation';
import { authenticate } from '../../middleware/auth.middleware';

const router: Router = Router();

router.use(authenticate);

router.post('/generate', validateRequest(generateBillSchema), billController.generateBill);
router.get('/', billController.getBills);

export default router;
