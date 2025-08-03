import type { Express } from "express";
import { storyEngineService } from "../engines/StoryEngineService";
import { isAuthenticated } from "../auth";

/**
 * V2 Story Routes - Using the new modular story engine
 * Demonstrates Phase 1 architecture improvements
 */
export function registerV2StoryRoutes(app: Express) {
  
  // Navigate story using new engine
  app.post('/api/v2/story/navigate', isAuthenticated, async (req: any, res) => {
    try {
      const { storyId, choiceId, targetPageId } = req.body;
      const userId = req.user.claims.sub;

      const result = await storyEngineService.navigate({
        userId,
        storyId,
        choiceId,
        targetPageId
      });

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      // Add tension metrics for enhanced UX
      const tensionMetrics = storyEngineService.getTensionMetrics(result.session);

      res.json({
        ...result.session,
        tensionMetrics
      });
    } catch (error) {
      console.error('V2 navigation error:', error);
      res.status(500).json({ error: 'Navigation failed' });
    }
  });

  // Get story analytics (admin only)
  app.get('/api/v2/analytics/:storyId?', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await require('../storage').storage.getUser(userId);
      
      // Only allow admin access
      if (user?.role !== 'admin' && user?.role !== 'mega-admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const { storyId } = req.params;
      
      const analytics = storyId 
        ? storyEngineService.getStoryAnalytics(storyId)
        : storyEngineService.getAnalytics();

      res.json(analytics);
    } catch (error) {
      console.error('Analytics error:', error);
      res.status(500).json({ error: 'Failed to get analytics' });
    }
  });

  // Health check for new engine
  app.get('/api/v2/health', (req, res) => {
    res.json({
      status: 'healthy',
      engine: 'v2-modular',
      features: {
        storyEngine: true,
        analytics: true,
        tensionMetrics: true,
        authProvider: true
      },
      timestamp: new Date().toISOString()
    });
  });
}