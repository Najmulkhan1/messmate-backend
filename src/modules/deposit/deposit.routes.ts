import { Router } from 'express';
import * as depositController from './deposit.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router: Router = Router();

router.post('/', authenticate, depositController.addDeposit);
router.get('/', authenticate, depositController.getDeposits);

export default router;
