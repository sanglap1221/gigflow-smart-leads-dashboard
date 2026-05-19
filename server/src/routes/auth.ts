import { Router } from 'express';
import { register, login, logout, getMe, getUsers } from '../controllers/auth.js';
import { protect, authorize } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { registerSchema, loginSchema } from '../validations/auth.js';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.get('/users', protect, authorize('ADMIN', 'MANAGER'), getUsers);

export default router;
