import { rateLimit, ipKeyGenerator } from "express-rate-limit";
import { Request, Response, NextFunction } from "express";
import { z } from "zod";

// Rate limiting configurations
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased limit for normal app usage
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for development and authenticated story reading
    if (process.env.NODE_ENV === 'development') return true;
    if (req.path.startsWith('/api/stories/') && req.method === 'GET') return true;
    if (req.path.startsWith('/api/reading-progress') && req.method === 'GET') return true;
    return false;
  }
});

export const premiumChoiceLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit premium choice purchases to 10 per minute
  message: "Too many premium choice attempts, please slow down.",
  keyGenerator: (req: any) => {
    // Use user ID if authenticated, otherwise fall back to IP with proper IPv6 handling
    if (req.user?.claims?.sub) {
      return req.user.claims.sub;
    }
    // Use the built-in IP key generator for IPv6 compatibility
    return ipKeyGenerator(req);
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Increased for normal auth usage
  message: "Too many login attempts, please try again later.",
  skip: (req) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV === 'development';
  }
});

// Input sanitization middleware
export function sanitizeInput(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Invalid input",
          details: error.errors
        });
      }
      next(error);
    }
  };
}

// User data anonymization
export function anonymizeUserData(userData: any) {
  if (!userData) return userData;
  
  // Hash email for privacy in adult content context
  const crypto = require('crypto');
  if (userData.email) {
    userData.emailHash = crypto.createHash('sha256').update(userData.email).digest('hex');
    delete userData.email; // Remove raw email from logs/analytics
  }
  
  return userData;
}

// Session security configuration
export const sessionConfig = {
  name: 'wildBranchSession',
  secret: process.env.SESSION_SECRET || 'your-session-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'strict' as const
  },
  rolling: true // Reset expiry on activity
};

// Input validation schemas
export const storyContentSchema = z.object({
  title: z.string().min(1).max(200).regex(/^[a-zA-Z0-9\s\-.,!?'"]+$/),
  content: z.string().min(1).max(10000),
  choiceText: z.string().min(1).max(500).optional(),
});

export const premiumChoiceSchema = z.object({
  choiceId: z.string().uuid(),
  storyId: z.string().uuid(),
  pageId: z.string().uuid(),
});