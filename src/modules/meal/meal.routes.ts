import { Router } from 'express';
import * as mealController from './meal.controller';
import { validateRequest } from '../../middleware/validate-request';
import { addMealSchema } from './meal.validation';
import { authenticate } from '../../middleware/auth.middleware';
import { requireMessAccess } from '../../middleware/rbac.middleware';

const router: Router = Router();

router.use(authenticate);
router.use(requireMessAccess);

router.post('/', validateRequest(addMealSchema), mealController.logMeal);
router.get('/', mealController.getMeals);
router.patch('/:id/toggle', mealController.toggleMeal);

export default router;
