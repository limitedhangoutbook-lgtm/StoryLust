import { AuthProvider, type AuthUser, type AuthConfig } from '../AuthProvider';
import type { Express, Request, Response, NextFunction, RequestHandler } from 'express';
import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";
import passport from "passport";
import session from "express-session";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";

/**
 * Replit OIDC Authentication Provider
 * Wraps existing Replit auth logic in modular interface
 */
export class ReplitAuth extends AuthProvider {
  name = 'replit';
  private config: AuthConfig;
  private oidcConfig: any;

  constructor(config: AuthConfig) {
    super();
    this.config = config;
    this.getOidcConfig = memoize(this.getOidcConfig.bind(this), { maxAge: 3600 * 1000 });
  }

  async setup(app: Express): Promise<void> {
    // Setup session middleware
    app.set("trust proxy", 1);
    app.use(this.getSession());
    app.use(passport.initialize());
    app.use(passport.session());

    // Setup OIDC
    this.oidcConfig = await this.getOidcConfig();
    this.setupPassportStrategy();

    // Setup auth routes
    app.get("/api/login", this.handleLogin);
    app.get("/api/callback", this.handleCallback!);
    app.get("/api/logout", this.handleLogout);
  }

  isAuthenticated: RequestHandler = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as any;

    if (!req.isAuthenticated() || !user?.expires_at) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const now = Math.floor(Date.now() / 1000);
    if (now <= user.expires_at) {
      return next();
    }

    // Handle token refresh
    const refreshToken = user.refresh_token;
    if (!refreshToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const tokenResponse = await client.refreshTokenGrant(this.oidcConfig, refreshToken);
      this.updateUserSession(user, tokenResponse);
      return next();
    } catch (error) {
      return res.status(401).json({ message: "Unauthorized" });
    }
  };

  getUser(req: Request): AuthUser | null {
    if (!req.isAuthenticated() || !req.user) {
      return null;
    }

    const user = req.user as any;
    return {
      id: user.claims?.sub,
      email: user.claims?.email,
      firstName: user.claims?.first_name,
      lastName: user.claims?.last_name,
      profileImageUrl: user.claims?.profile_image_url,
      claims: user.claims
    };
  }

  getUserId(req: Request): string | null {
    const user = this.getUser(req);
    return user?.id || null;
  }

  handleLogin: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  };

  handleLogout: RequestHandler = (req: Request, res: Response) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(this.oidcConfig, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  };

  handleCallback: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: this.config.redirectUrls?.success || "/",
      failureRedirect: this.config.redirectUrls?.failure || "/api/login",
    })(req, res, next);
  };

  async refreshSession(req: Request): Promise<boolean> {
    const user = req.user as any;
    if (!user?.refresh_token) return false;

    try {
      const tokenResponse = await client.refreshTokenGrant(this.oidcConfig, user.refresh_token);
      this.updateUserSession(user, tokenResponse);
      return true;
    } catch {
      return false;
    }
  }

  private async getOidcConfig() {
    if (!process.env.REPLIT_DOMAINS) {
      throw new Error("Environment variable REPLIT_DOMAINS not provided");
    }

    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  }

  private getSession() {
    const sessionTtl = this.config.sessionTtl || 7 * 24 * 60 * 60 * 1000; // 1 week
    const pgStore = connectPg(session);
    const sessionStore = new pgStore({
      conString: process.env.DATABASE_URL,
      createTableIfMissing: false,
      ttl: sessionTtl,
      tableName: "sessions",
    });

    return session({
      secret: this.config.sessionSecret,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: true,
        maxAge: sessionTtl,
      },
    });
  }

  private setupPassportStrategy() {
    const verify: VerifyFunction = async (
      tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
      verified: passport.AuthenticateCallback
    ) => {
      const user = {};
      this.updateUserSession(user, tokens);
      
      // Store user in database (handled by storage layer)

      
      verified(null, user);
    };

    if (!process.env.REPLIT_DOMAINS) return;

    for (const domain of process.env.REPLIT_DOMAINS.split(",")) {
      const strategy = new Strategy(
        {
          name: `replitauth:${domain}`,
          config: this.oidcConfig,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
    }

    passport.serializeUser((user: Express.User, cb) => cb(null, user));
    passport.deserializeUser((user: Express.User, cb) => cb(null, user));
  }

  private updateUserSession(
    user: any,
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers
  ) {
    user.claims = tokens.claims();
    user.access_token = tokens.access_token;
    user.refresh_token = tokens.refresh_token;
    user.expires_at = user.claims?.exp;
  }
}