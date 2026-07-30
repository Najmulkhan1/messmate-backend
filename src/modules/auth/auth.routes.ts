import { Router } from 'express';
import * as authController from './auth.controller';
import { validateRequest } from '../../middleware/validate-request';
import { registerSchema, loginSchema } from './auth.validation';
import { authenticate } from '../../middleware/auth.middleware';
import { authLimiter } from '../../middleware/rate-limiter';

const router = Router();

router.use(authLimiter);

router.post('/register', validateRequest(registerSchema), authController.register);
router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);

router.get('/me', authenticate, authController.getMe);

export default router;
