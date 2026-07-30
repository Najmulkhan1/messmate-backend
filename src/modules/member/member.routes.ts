import { Router } from 'express';
import * as memberController from './member.controller';
import { validateRequest } from '../../middleware/validate-request';
import { addMemberSchema } from './member.validation';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/add', validateRequest(addMemberSchema), memberController.addMember);
router.get('/', memberController.getMembers);
router.delete('/:memberId', memberController.removeMember);
router.patch('/:memberId/bazaar-permission', memberController.toggleBazaarPermission);

export default router;
