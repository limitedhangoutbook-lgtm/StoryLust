import { StoryEngine } from '../../shared/story-engine/StoryEngine';
import { DatabaseStoryProvider } from '../adapters/DatabaseStoryProvider';
import { analytics } from '../analytics/EventTracker';
import type { 
  NavigationRequest,
  NavigationResult,
  EngineConfig 
} from '../../shared/story-engine/types/EngineTypes';

/**
 * Story Engine Service - Server-side wrapper for the story engine
 * Handles data provider injection and analytics integration
 */
export class StoryEngineService {
  private engine: StoryEngine;
  private dataProvider: DatabaseStoryProvider;

  constructor(config: Partial<EngineConfig> = {}) {
    this.engine = new StoryEngine({
      enableAnalytics: true,
      enableTensionMechanics: true,
      defaultChoiceDelay: 500,
      maxChoicesPerPage: 6,
      ...config
    });
    
    this.dataProvider = new DatabaseStoryProvider();
  }

  /**
   * Navigate through story with analytics tracking
   */
  async navigate(request: NavigationRequest): Promise<NavigationResult> {
    try {
      const result = await this.engine.navigate(request, this.dataProvider);

      // Track analytics event if successful
      if (result.success && result.analyticsEvent) {
        analytics.track(result.analyticsEvent);
      }

      return result;
    } catch (error) {
      console.error('Story engine navigation error:', error);
      return {
        success: false,
        session: null as any,
        error: error instanceof Error ? error.message : 'Navigation failed'
      };
    }
  }

  /**
   * Get tension metrics for enhanced UX
   */
  getTensionMetrics(session: any) {
    return this.engine.getTensionMetrics(session);
  }

  /**
   * Get analytics data for story optimization
   */
  getAnalytics() {
    return {
      recentEvents: analytics.getRecentEvents(50),
      conversionMetrics: analytics.getConversionMetrics(),
      choicePopularity: analytics.getChoicePopularity()
    };
  }

  /**
   * Get story-specific analytics
   */
  getStoryAnalytics(storyId: string) {
    return {
      events: analytics.getStoryEvents(storyId),
      metrics: analytics.getConversionMetrics(storyId),
      choicePopularity: analytics.getChoicePopularity(storyId)
    };
  }
}

// Global story engine instance
export const storyEngineService = new StoryEngineService();