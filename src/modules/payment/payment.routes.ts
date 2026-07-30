import { Router } from 'express';
import * as paymentController from './payment.controller';
import { validateRequest } from '../../middleware/validate-request';
import { payBillSchema, verifyPaymentSchema } from './payment.validation';
import { authenticate } from '../../middleware/auth.middleware';

const router: Router = Router();

router.use(authenticate);

// Member routes
router.get('/', paymentController.getMyPayments);
router.patch('/:id/pay', validateRequest(payBillSchema), paymentController.submitPayment);

// Manager routes
router.get('/mess', paymentController.getMessPayments);
router.patch('/:id/verify', validateRequest(verifyPaymentSchema), paymentController.verifyPayment);

export default router;
