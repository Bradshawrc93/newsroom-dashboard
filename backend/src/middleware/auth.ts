import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload, AuthUser, CustomError } from '../types';
import { userStorage } from '../utils/storage';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Authentication middleware
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      throw new CustomError('Access token required', 401);
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new CustomError('JWT secret not configured', 500);
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    
    // Get user from storage
    const userData = await userStorage.read();
    const user = userData.users.find(u => u.id === decoded.userId);
    
    if (!user) {
      throw new CustomError('User not found', 401);
    }

    // Create AuthUser object
    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      teamId: decoded.teamId,
      // @ts-ignore
      teamName: decoded.teamName || 'Unknown Team',
      // @ts-ignore
      accessToken: decoded.accessToken || '',
      avatar: user.avatar,
    };

    req.user = authUser;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new CustomError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new CustomError('Token expired', 401));
    } else {
      next(error);
    }
  }
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      next();
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      next();
      return;
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;
    
    const userData = await userStorage.read();
    const user = userData.users.find(u => u.id === decoded.userId);
    
    if (user) {
      const authUser: AuthUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        teamId: decoded.teamId,
        // @ts-ignore
        teamName: decoded.teamName || 'Unknown Team',
        // @ts-ignore
        accessToken: decoded.accessToken || '',
        avatar: user.avatar,
      };
      req.user = authUser;
    }

    next();
  } catch (error) {
    // Silently continue if token is invalid
    next();
  }
};

/**
 * Generate JWT token
 */
export const generateToken = (user: AuthUser): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new CustomError('JWT secret not configured', 500);
  }

  const payload: JwtPayload = {
    userId: user.id,
    teamId: user.teamId,
    email: user.email,
    // @ts-ignore
    accessToken: user.accessToken,
    teamName: user.teamName,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
  };

  return jwt.sign(payload, secret);
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (userId: string): string => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new CustomError('JWT secret not configured', 500);
  }

  const payload = {
    userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
  };

  return jwt.sign(payload, secret);
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): { userId: string } => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new CustomError('JWT secret not configured', 500);
  }

  const decoded = jwt.verify(token, secret) as { userId: string };
  return decoded;
};

/**
 * Role-based authorization middleware
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new CustomError('Authentication required', 401));
      return;
    }

    // For now, we'll use a simple role check based on email patterns
    // In a real app, you might have explicit role assignments
    const userRole = inferRoleFromEmail(req.user.email);
    
    if (!roles.includes(userRole)) {
      next(new CustomError('Insufficient permissions', 403));
      return;
    }

    next();
  };
};

/**
 * Squad-based authorization middleware
 */
export const requireSquad = (squads: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      next(new CustomError('Authentication required', 401));
      return;
    }

    const userData = await userStorage.read();
    const user = userData.users.find(u => u.id === req.user!.id);
    
    if (!user || !user.squad || !squads.includes(user.squad)) {
      next(new CustomError('Insufficient squad permissions', 403));
      return;
    }

    next();
  };
};

/**
 * Infer role from email (simple implementation)
 */
function inferRoleFromEmail(email: string): string {
  const emailLower = email.toLowerCase();
  
  if (emailLower.includes('admin') || emailLower.includes('manager')) return 'admin';
  if (emailLower.includes('lead') || emailLower.includes('senior')) return 'lead';
  if (emailLower.includes('pm') || emailLower.includes('product')) return 'pm';
  
  return 'user';
}

/**
 * Rate limiting helper
 */
export const createRateLimiter = (windowMs: number, maxRequests: number) => {
  const requests = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const key = req.user?.id || req.ip || 'anonymous';
    const now = Date.now();

    const userRequests = requests.get(key);
    
    if (!userRequests || now > userRequests.resetTime) {
      requests.set(key, { count: 1, resetTime: now + windowMs });
      next();
      return;
    }

    if (userRequests.count >= maxRequests) {
      next(new CustomError('Rate limit exceeded', 429));
      return;
    }

    userRequests.count++;
    next();
  };
};
