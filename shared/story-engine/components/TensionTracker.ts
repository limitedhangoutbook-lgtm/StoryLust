/**
 * Tension Tracker - Manages story emotional tension and pacing
 * Part of Phase 2: Enhanced UX Components
 */

export interface TensionEvent {
  type: 'rising' | 'climax' | 'falling' | 'resolution';
  intensity: number; // 0-100
  pageNumber: number;
  trigger: 'choice' | 'content' | 'premium_unlock' | 'story_branch';
  metadata?: Record<string, any>;
}

export interface TensionProfile {
  currentLevel: number; // 0-100
  peakLevel: number;
  averageLevel: number;
  recentEvents: TensionEvent[];
  lastClimax?: number; // page number
  predictedPeak?: number; // predicted page for next climax
}

export class TensionTracker {
  private profile: TensionProfile;
  private config: {
    maxEvents: number;
    climaxThreshold: number;
    decayRate: number;
    premiumBoost: number;
  };

  constructor() {
    this.profile = {
      currentLevel: 20, // Start with mild anticipation
      peakLevel: 0,
      averageLevel: 20,
      recentEvents: []
    };
    
    this.config = {
      maxEvents: 50,
      climaxThreshold: 80,
      decayRate: 0.95,
      premiumBoost: 15
    };
  }

  /**
   * Track a tension event and update the profile
   */
  trackEvent(event: TensionEvent): TensionProfile {
    // Add timestamp
    const enhancedEvent = {
      ...event,
      timestamp: Date.now()
    };

    // Update current tension based on event
    this.updateTensionLevel(enhancedEvent);
    
    // Store event
    this.profile.recentEvents.push(enhancedEvent);
    
    // Maintain event history limit
    if (this.profile.recentEvents.length > this.config.maxEvents) {
      this.profile.recentEvents = this.profile.recentEvents.slice(-this.config.maxEvents);
    }

    // Update peak tracking
    if (this.profile.currentLevel > this.profile.peakLevel) {
      this.profile.peakLevel = this.profile.currentLevel;
    }

    // Detect climax points
    if (this.profile.currentLevel >= this.config.climaxThreshold) {
      this.profile.lastClimax = event.pageNumber;
    }

    // Calculate average
    this.updateAverageLevel();
    
    // Predict next peak
    this.predictNextClimax();

    return { ...this.profile };
  }

  /**
   * Get current tension state for UI components
   */
  getCurrentState(): {
    level: number;
    category: 'low' | 'building' | 'high' | 'climax';
    recommendation: string;
    visualCue: string;
  } {
    const level = this.profile.currentLevel;
    
    let category: 'low' | 'building' | 'high' | 'climax';
    let recommendation: string;
    let visualCue: string;

    if (level < 30) {
      category = 'low';
      recommendation = 'Perfect time for character development or world building';
      visualCue = 'calm-blue';
    } else if (level < 60) {
      category = 'building';
      recommendation = 'Tension is rising - consider introducing conflict';
      visualCue = 'warm-amber';
    } else if (level < 80) {
      category = 'high';
      recommendation = 'High tension - approaching a crucial moment';
      visualCue = 'intense-orange';
    } else {
      category = 'climax';
      recommendation = 'Climax moment - time for major revelations or choices';
      visualCue = 'peak-red';
    }

    return { level, category, recommendation, visualCue };
  }

  /**
   * Calculate optimal premium choice placement
   */
  getOptimalPremiumPlacement(): {
    recommendedPages: number[];
    reasoning: string;
    expectedImpact: number;
  } {
    const recentPeaks = this.findRecentPeaks();
    const tensionGaps = this.findTensionGaps();
    
    // Premium choices work best just before tension peaks
    const recommendedPages = recentPeaks
      .map(peak => peak - 1) // One page before peak
      .filter(page => page > 0)
      .concat(tensionGaps) // Also at low tension points for contrast
      .sort((a, b) => a - b)
      .slice(0, 3); // Top 3 recommendations

    const reasoning = `Premium choices placed at pages ${recommendedPages.join(', ')} will maximize emotional impact and conversion`;
    const expectedImpact = this.calculateExpectedImpact(recommendedPages);

    return { recommendedPages, reasoning, expectedImpact };
  }

  /**
   * Get tension-based reading recommendations
   */
  getReadingRecommendations(): {
    pacing: 'slow-down' | 'maintain' | 'speed-up';
    nextAction: string;
    emotionalState: string;
  } {
    const state = this.getCurrentState();
    const recentTrend = this.getRecentTrend();

    let pacing: 'slow-down' | 'maintain' | 'speed-up';
    let nextAction: string;
    let emotionalState: string;

    if (state.level > 70 && recentTrend > 10) {
      pacing = 'slow-down';
      nextAction = 'Savor this intense moment';
      emotionalState = 'On the edge of anticipation';
    } else if (state.level < 40 && recentTrend < -5) {
      pacing = 'speed-up';
      nextAction = 'Something exciting is coming';
      emotionalState = 'Building curiosity';
    } else {
      pacing = 'maintain';
      nextAction = 'Continue at your pace';
      emotionalState = 'Engaged and interested';
    }

    return { pacing, nextAction, emotionalState };
  }

  // Private helper methods
  private updateTensionLevel(event: TensionEvent): void {
    let change = 0;

    switch (event.type) {
      case 'rising':
        change = event.intensity * 0.6;
        break;
      case 'climax':
        change = event.intensity * 1.2;
        break;
      case 'falling':
        change = -event.intensity * 0.4;
        break;
      case 'resolution':
        change = -event.intensity * 0.8;
        break;
    }

    // Premium content gets a tension boost
    if (event.trigger === 'premium_unlock') {
      change += this.config.premiumBoost;
    }

    // Apply change with bounds checking
    this.profile.currentLevel = Math.max(0, Math.min(100, this.profile.currentLevel + change));
    
    // Natural decay over time
    this.profile.currentLevel *= this.config.decayRate;
  }

  private updateAverageLevel(): void {
    if (this.profile.recentEvents.length === 0) return;
    
    const sum = this.profile.recentEvents.reduce((acc, event) => acc + event.intensity, 0);
    this.profile.averageLevel = sum / this.profile.recentEvents.length;
  }

  private predictNextClimax(): void {
    const recentPeaks = this.findRecentPeaks();
    if (recentPeaks.length >= 2) {
      const avgInterval = recentPeaks.reduce((acc, peak, i) => {
        if (i === 0) return acc;
        return acc + (peak - recentPeaks[i - 1]);
      }, 0) / (recentPeaks.length - 1);

      const lastPeak = recentPeaks[recentPeaks.length - 1];
      this.profile.predictedPeak = Math.round(lastPeak + avgInterval);
    }
  }

  private findRecentPeaks(): number[] {
    return this.profile.recentEvents
      .filter(event => event.intensity > this.config.climaxThreshold)
      .map(event => event.pageNumber)
      .filter((page, index, arr) => arr.indexOf(page) === index) // Remove duplicates
      .sort((a, b) => a - b);
  }

  private findTensionGaps(): number[] {
    const lowTensionEvents = this.profile.recentEvents
      .filter(event => event.intensity < 30)
      .map(event => event.pageNumber);

    return lowTensionEvents.slice(-3); // Last 3 low tension points
  }

  private getRecentTrend(): number {
    if (this.profile.recentEvents.length < 3) return 0;
    
    const recent = this.profile.recentEvents.slice(-3);
    const oldLevel = recent[0].intensity;
    const newLevel = recent[recent.length - 1].intensity;
    
    return newLevel - oldLevel;
  }

  private calculateExpectedImpact(pages: number[]): number {
    // Simple heuristic: impact based on tension variance at those points
    return Math.min(95, pages.length * 20 + this.profile.peakLevel * 0.3);
  }

  /**
   * Reset tension tracking for new story
   */
  reset(): void {
    this.profile = {
      currentLevel: 20,
      peakLevel: 0,
      averageLevel: 20,
      recentEvents: []
    };
  }

  /**
   * Get tension profile for analytics
   */
  getProfile(): TensionProfile {
    return { ...this.profile };
  }
}

// Export singleton instance
export const tensionTracker = new TensionTracker();