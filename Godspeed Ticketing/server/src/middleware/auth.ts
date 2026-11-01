import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.js';
import { User, IUser } from '../models/User.js';

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token = '';

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && (req.cookies.godspeed_token || req.cookies.qubix_token)) {
      token = req.cookies.godspeed_token || req.cookies.qubix_token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required. Please sign in to continue.',
        },
      });
      return;
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Session expired or invalid token. Please refresh or sign in again.',
        },
      });
      return;
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User account not found or has been deactivated.',
        },
      });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Internal authentication error: ' + err.message,
      },
    });
  }
};

export const requireSuperAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user || !req.user.isSuperAdmin) {
    res.status(403).json({
      success: false,
      error: {
        code: 'SUPER_ADMIN_REQUIRED',
        message: 'Platform Super Admin privileges required for this action.',
      },
    });
    return;
  }
  next();
};

