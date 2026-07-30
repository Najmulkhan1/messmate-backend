import { Router } from 'express';
import * as memberController from './member.controller';
import { validateRequest } from '../../middleware/validate-request';
import { addMemberSchema } from './member.validation';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize, requireMessAccess } from '../../middleware/rbac.middleware';

const router: Router = Router();

router.use(authenticate);
router.use(requireMessAccess);

router.post('/add', authorize('MANAGER'), validateRequest(addMemberSchema), memberController.addMember);
router.get('/', memberController.getMembers);
router.delete('/:memberId', authorize('MANAGER'), memberController.removeMember);
router.patch('/:memberId/bazaar-permission', authorize('MANAGER'), memberController.toggleBazaarPermission);

export default router;
