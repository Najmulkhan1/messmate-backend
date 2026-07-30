import express, { Express, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import sanitizeHtml from 'sanitize-html';

dotenv.config();

const app: Express = express();
const httpServer = createServer(app);

import authRoutes from './modules/auth/auth.routes';
import { generalLimiter } from './middleware/rate-limiter';

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(generalLimiter);

// Custom sanitize middleware for req.body
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeHtml(req.body[key]);
      }
    }
  }
  next();
});

// Routes
app.use('/api/auth', authRoutes);

// Socket.io initialization
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  const uptimeHours = Math.floor(process.uptime() / 3600);
  const uptimeMinutes = Math.floor((process.uptime() % 3600) / 60);
  const uptimeSeconds = Math.floor(process.uptime() % 60);
  
  const uptimeString = `${uptimeHours}h ${uptimeMinutes}m ${uptimeSeconds}s`;

  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    uptimeFormatted: uptimeString
  });
});

// Error Handler Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

export { app, httpServer, io };
