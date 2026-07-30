import { Router, Request, Response } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import messRoutes from '../modules/mess/mess.routes';
import memberRoutes from '../modules/member/member.routes';
import mealRoutes from '../modules/meal/meal.routes';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.send(`
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; margin-top: 100px; color: #333;">
      <h1 style="color: #4CAF50; font-size: 3rem; margin-bottom: 10px;">Welcome to MessMate API! 🚀</h1>
      <p style="font-size: 1.2rem; color: #666;">Your backend server is up and running perfectly.</p>
      <div style="margin-top: 30px;">
        <a href="/api/health" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; font-size: 1rem; transition: background-color 0.3s;">
          Check Server Health
        </a>
      </div>
    </div>
  `);
});

router.get('/api/health', (req: Request, res: Response) => {
  const uptimeHours = Math.floor(process.uptime() / 3600);
  const uptimeMinutes = Math.floor((process.uptime() % 3600) / 60);
  const uptimeSeconds = Math.floor(process.uptime() % 60);
  
  const uptimeString = `${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s`;

  res.status(200).json({ 
    status: 'ok',
    message: '🚀 MessMate Backend is running perfectly! All systems go.',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    uptimeFormatted: uptimeString
  });
});

// API Routes
router.use('/api/auth', authRoutes);
router.use('/api/mess', messRoutes);
router.use('/api/members', memberRoutes);
router.use('/api/meals', mealRoutes);

export default router;
