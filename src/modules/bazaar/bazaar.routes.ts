import { Router } from 'express';
import * as bazaarController from './bazaar.controller';
import { validateRequest } from '../../middleware/validate-request';
import { addBazaarSchema, updateBazaarSchema } from './bazaar.validation';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Protect all bazaar routes
router.use(authenticate);

router.post('/', validateRequest(addBazaarSchema), bazaarController.addBazaar);
router.get('/', bazaarController.getBazaars);
router.patch('/:bazaarId', validateRequest(updateBazaarSchema), bazaarController.updateBazaar);
router.delete('/:bazaarId', bazaarController.deleteBazaar);

export default router;
