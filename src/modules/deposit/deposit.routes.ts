import { Router } from 'express';
import * as depositController from './deposit.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize, requireMessAccess } from '../../middleware/rbac.middleware';

const router: Router = Router();

router.use(authenticate);
router.use(requireMessAccess);

router.post('/', authorize('MANAGER'), depositController.addDeposit);
router.get('/', depositController.getDeposits);

export default router;
