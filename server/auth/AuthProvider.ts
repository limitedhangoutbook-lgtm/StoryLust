import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Abstract authentication provider interface
 * Allows swapping between different auth systems (Replit, OAuth2, custom)
 */
export abstract class AuthProvider {
  abstract name: string;

  /**
   * Initialize authentication routes and middleware
   */
  abstract setup(app: any): Promise<void>;

  /**
   * Middleware to protect routes requiring authentication
   */
  abstract isAuthenticated: RequestHandler;

  /**
   * Get current user from request
   */
  abstract getUser(req: Request): AuthUser | null;

  /**
   * Get user ID from request
   */
  abstract getUserId(req: Request): string | null;

  /**
   * Login route handler
   */
  abstract handleLogin: RequestHandler;

  /**
   * Logout route handler  
   */
  abstract handleLogout: RequestHandler;

  /**
   * Callback route handler (for OAuth flows)
   */
  abstract handleCallback?: RequestHandler;

  /**
   * Refresh user session if needed
   */
  abstract refreshSession?(req: Request): Promise<boolean>;
}

/**
 * Standardized user interface across all auth providers
 */
export interface AuthUser {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  claims?: Record<string, any>;
}

/**
 * Auth provider configuration
 */
export interface AuthConfig {
  sessionSecret: string;
  sessionTtl?: number;
  enableRefresh?: boolean;
  redirectUrls?: {
    success: string;
    failure: string;
    logout: string;
  };
}

/**
 * Factory for creating auth providers
 */
export class AuthProviderFactory {
  private static providers = new Map<string, typeof AuthProvider>();

  static register(name: string, provider: typeof AuthProvider) {
    this.providers.set(name, provider);
  }

  static create(name: string, config: AuthConfig): AuthProvider {
    const ProviderClass = this.providers.get(name);
    if (!ProviderClass) {
      throw new Error(`Auth provider '${name}' not found`);
    }
    return new (ProviderClass as any)(config);
  }

  static getAvailable(): string[] {
    return Array.from(this.providers.keys());
  }
}

// Register available providers
import { ReplitAuth } from './providers/ReplitAuth';
AuthProviderFactory.register('replit', ReplitAuth);