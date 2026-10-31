import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';

// Routes
import authRoutes from './routes/auth.routes.js';
import organizationRoutes from './routes/organization.routes.js';
import projectRoutes from './routes/project.routes.js';
import ticketRoutes from './routes/ticket.routes.js';
import ticketCommentRoutes from './routes/ticketComment.routes.js';
import attachmentRoutes from './routes/attachment.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import reportRoutes from './routes/report.routes.js';
import workflowRoutes from './routes/workflow.routes.js';
import subscriptionRoutes from './routes/subscription.routes.js';
import adminRoutes from './routes/admin.routes.js';

export const createApp = (): Express => {
  const app = express();

  // Security Headers
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS Configuration
  const allowedOrigins = [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
          callback(null, true);
        } else {
          callback(null, true); // Dev flexible
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-organization-id', 'x-requested-with'],
    })
  );

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000, // Generous limit for enterprise SaaS interactive usage
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests. Please slow down.' },
    },
  });
  app.use('/api/', limiter);

  // Parsers & Logging
  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));
  app.use(cookieParser());
  app.use(morgan('dev'));

  // Static uploads serving
  const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
  app.use('/uploads', express.static(uploadDir));

  // Healthcheck
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'UP',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      service: 'QUBIX Backend API v1.0',
    });
  });

  // API v1 Routing
  const apiV1 = express.Router();
  apiV1.use('/auth', authRoutes);
  apiV1.use('/organizations', organizationRoutes);
  apiV1.use('/projects', projectRoutes);
  apiV1.use('/tickets', ticketRoutes);
  apiV1.use('/ticket-comments', ticketCommentRoutes);
  apiV1.use('/attachments', attachmentRoutes);
  apiV1.use('/notifications', notificationRoutes);
  apiV1.use('/reports', reportRoutes);
  apiV1.use('/workflows', workflowRoutes);
  apiV1.use('/subscriptions', subscriptionRoutes);
  apiV1.use('/admin', adminRoutes);

  app.use('/api/v1', apiV1);

  // 404 Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${req.method} ${req.originalUrl} not found on QUBIX server.`,
      },
    });
  });

  // Centralized Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[GlobalErrorHandler]', err);
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: err.code || 'INTERNAL_SERVER_ERROR',
        message: err.message || 'An unexpected server error occurred.',
      },
    });
  });

  return app;
};

