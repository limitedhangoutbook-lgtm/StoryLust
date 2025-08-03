import type { AnalyticsEvent } from '../../shared/story-engine/types/EngineTypes';

/**
 * Analytics event tracking system
 * Handles collection and processing of user interaction data
 */
export class EventTracker {
  private events: AnalyticsEvent[] = [];
  private maxEvents = 1000; // In-memory limit before flushing

  /**
   * Record an analytics event
   */
  track(event: AnalyticsEvent): void {
    // Add server timestamp if not provided
    const enrichedEvent: AnalyticsEvent = {
      ...event,
      timestamp: event.timestamp || new Date()
    };

    this.events.push(enrichedEvent);

    // Log important events
    this.logEvent(enrichedEvent);

    // Flush to persistent storage if needed
    if (this.events.length >= this.maxEvents) {
      this.flush();
    }
  }

  /**
   * Get recent events for analysis
   */
  getRecentEvents(limit = 100): AnalyticsEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Get events by type
   */
  getEventsByType(type: AnalyticsEvent['type'], limit = 50): AnalyticsEvent[] {
    return this.events
      .filter(event => event.type === type)
      .slice(-limit);
  }

  /**
   * Get user-specific events
   */
  getUserEvents(userId: string, limit = 50): AnalyticsEvent[] {
    return this.events
      .filter(event => event.userId === userId)
      .slice(-limit);
  }

  /**
   * Get story-specific events
   */
  getStoryEvents(storyId: string, limit = 50): AnalyticsEvent[] {
    return this.events
      .filter(event => event.storyId === storyId)
      .slice(-limit);
  }

  /**
   * Calculate conversion metrics
   */
  getConversionMetrics(storyId?: string): {
    totalPageViews: number;
    uniqueUsers: number;
    purchaseAttempts: number;
    completions: number;
    conversionRate: number;
  } {
    const relevantEvents = storyId 
      ? this.events.filter(e => e.storyId === storyId)
      : this.events;

    const pageViews = relevantEvents.filter(e => e.type === 'page_view').length;
    const uniqueUsers = new Set(relevantEvents.map(e => e.userId)).size;
    const purchases = relevantEvents.filter(e => e.type === 'purchase_attempt').length;
    const completions = relevantEvents.filter(e => e.type === 'story_completed').length;

    return {
      totalPageViews: pageViews,
      uniqueUsers,
      purchaseAttempts: purchases,
      completions,
      conversionRate: pageViews > 0 ? (purchases / pageViews) * 100 : 0
    };
  }

  /**
   * Get popular choices for A/B testing
   */
  getChoicePopularity(storyId?: string): Record<string, number> {
    const choiceEvents = this.events.filter(e => 
      e.type === 'choice_made' && 
      e.choiceId &&
      (!storyId || e.storyId === storyId)
    );

    const popularity: Record<string, number> = {};
    choiceEvents.forEach(event => {
      if (event.choiceId) {
        popularity[event.choiceId] = (popularity[event.choiceId] || 0) + 1;
      }
    });

    return popularity;
  }

  /**
   * Clear old events (memory management)
   */
  clearOldEvents(daysOld = 7): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    this.events = this.events.filter(event => 
      event.timestamp.getTime() > cutoffDate.getTime()
    );
  }

  private logEvent(event: AnalyticsEvent): void {
    // Log significant events for debugging
    if (event.type === 'purchase_attempt' || event.type === 'story_completed') {
      console.log(`[Analytics] ${event.type}:`, {
        user: event.userId,
        story: event.storyId,
        page: event.pageId,
        choice: event.choiceId,
        timestamp: event.timestamp
      });
    }
  }

  private async flush(): Promise<void> {
    // In a production system, this would save to database
    // For now, we keep events in memory but limit the size
    console.log(`[Analytics] Flushing ${this.events.length} events`);
    
    // Keep only recent events
    this.events = this.events.slice(-500);
  }
}

// Global analytics instance
export const analytics = new EventTracker();