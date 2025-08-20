import type { Express } from "express";
import { isAuthenticated } from "../auth";
import { advancedAnalytics } from "./advanced-analytics";
import { generalLimiter } from "../security";

// Analytics API routes for admin dashboard
export function registerAnalyticsRoutes(app: Express) {
  
  // Get premium choice analytics (admin only)
  app.get('/api/analytics/premium-choices', 
    isAuthenticated, 
    generalLimiter,
    async (req: any, res) => {
      const user = req.user;
      
      // Check if user is admin or mega-admin
      if (!user || (user.role !== 'admin' && user.role !== 'mega-admin')) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      try {
        const timeRange = parseInt(req.query.days as string) || 30;
        const analytics = await advancedAnalytics.getPremiumChoiceAnalytics(timeRange);
        
        res.json({
          analytics,
          timeRange,
          generatedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('Premium choice analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
      }
    }
  );

  // Get user behavior metrics (admin only)
  app.get('/api/analytics/user-behavior/:userId',
    isAuthenticated,
    generalLimiter,
    async (req: any, res) => {
      const user = req.user;
      
      // Check if user is admin or mega-admin, or requesting own data
      const targetUserId = req.params.userId;
      const canAccess = user && (
        user.role === 'admin' || 
        user.role === 'mega-admin' || 
        user.claims.sub === targetUserId
      );
      
      if (!canAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      try {
        const metrics = await advancedAnalytics.getUserBehaviorMetrics(targetUserId);
        res.json(metrics);
      } catch (error) {
        console.error('User behavior analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch user metrics' });
      }
    }
  );

  // Get content performance analytics (admin only)
  app.get('/api/analytics/content-performance',
    isAuthenticated,
    generalLimiter,
    async (req: any, res) => {
      const user = req.user;
      
      if (!user || (user.role !== 'admin' && user.role !== 'mega-admin')) {
        return res.status(403).json({ error: 'Admin access required' });
      }
      
      try {
        const timeRange = parseInt(req.query.days as string) || 30;
        const performance = await advancedAnalytics.getContentPerformance(timeRange);
        
        res.json({
          performance,
          timeRange,
          generatedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error('Content performance analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch content analytics' });
      }
    }
  );
}