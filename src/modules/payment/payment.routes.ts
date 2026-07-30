import { Router } from 'express';
import * as paymentController from './payment.controller';
import { validateRequest } from '../../middleware/validate-request';
import { payBillSchema, verifyPaymentSchema } from './payment.validation';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize, requireMessAccess } from '../../middleware/rbac.middleware';

const router: Router = Router();

router.use(authenticate);
router.use(requireMessAccess);

router.get('/', paymentController.getMyPayments);
router.patch('/:id/pay', validateRequest(payBillSchema), paymentController.submitPayment);
router.get('/mess', authorize('MANAGER'), paymentController.getMessPayments);
router.patch('/:id/verify', authorize('MANAGER'), validateRequest(verifyPaymentSchema), paymentController.verifyPayment);

export default router;
