import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../lib/database';

// Extend Request type to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      res.status(401).json({
        error: 'Access denied',
        message: 'No token provided'
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret-key'
    ) as { userId: string };

    // Check if user exists and is active
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, isActive: true }
    });

    if (!user || !user.isActive) {
      res.status(401).json({
        error: 'Access denied',
        message: 'Invalid or inactive user'
      });
      return;
    }

    // Add userId to request
    req.userId = decoded.userId;
    next();

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: 'Access denied',
        message: 'Invalid token'
      });
      return;
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Authentication failed'
    });
  }
};

// Optional auth middleware - doesn't fail if no token
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : null;

    if (!token) {
      next(); // Continue without authentication
      return;
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback-secret-key'
    ) as { userId: string };

    // Check if user exists and is active
    const user = await db.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, isActive: true }
    });

    if (user && user.isActive) {
      req.userId = decoded.userId;
    }

    next();

  } catch (error) {
    // Ignore auth errors in optional auth
    next();
  }
};
