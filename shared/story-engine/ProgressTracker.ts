import type { 
  UserProgress, 
  StoryPage,
  AnalyticsEvent 
} from './types/EngineTypes';

export class ProgressTracker {
  /**
   * Updates user progress when navigating to a new page
   * Handles page completion tracking and analytics events
   */
  static updateProgress(
    currentProgress: UserProgress,
    newPage: StoryPage,
    choiceId?: string
  ): { progress: UserProgress; analyticsEvent?: AnalyticsEvent } {
    const updatedProgress: UserProgress = {
      ...currentProgress,
      currentPageId: newPage.id,
      completedPages: this.addCompletedPage(currentProgress.completedPages, newPage.id),
      lastReadAt: new Date()
    };

    // Generate analytics event
    const analyticsEvent: AnalyticsEvent = {
      type: newPage.isEnding ? 'story_completed' : 'page_view',
      userId: currentProgress.userId,
      storyId: currentProgress.storyId,
      pageId: newPage.id,
      choiceId,
      timestamp: new Date(),
      metadata: {
        pageNumber: newPage.pageNumber,
        isEnding: newPage.isEnding,
        totalPagesCompleted: updatedProgress.completedPages.length
      }
    };

    return { progress: updatedProgress, analyticsEvent };
  }

  /**
   * Records a premium choice purchase
   */
  static recordPurchase(
    currentProgress: UserProgress,
    choiceId: string
  ): { progress: UserProgress; analyticsEvent: AnalyticsEvent } {
    const updatedProgress: UserProgress = {
      ...currentProgress,
      purchasedChoices: [...currentProgress.purchasedChoices, choiceId],
      lastReadAt: new Date()
    };

    const analyticsEvent: AnalyticsEvent = {
      type: 'purchase_attempt',
      userId: currentProgress.userId,
      storyId: currentProgress.storyId,
      pageId: currentProgress.currentPageId,
      choiceId,
      timestamp: new Date(),
      metadata: {
        totalPurchases: updatedProgress.purchasedChoices.length
      }
    };

    return { progress: updatedProgress, analyticsEvent };
  }

  /**
   * Calculates reading statistics for analytics
   */
  static getReadingStats(progress: UserProgress): {
    completionPercentage: number;
    totalPagesRead: number;
    premiumChoicesPurchased: number;
    sessionDuration?: number;
  } {
    return {
      completionPercentage: 0, // Will be calculated against story metadata
      totalPagesRead: progress.completedPages.length,
      premiumChoicesPurchased: progress.purchasedChoices.length
    };
  }

  /**
   * Determines if user should see completion rewards or achievements
   */
  static checkForAchievements(progress: UserProgress): string[] {
    const achievements: string[] = [];

    if (progress.completedPages.length >= 10) {
      achievements.push('dedicated_reader');
    }

    if (progress.purchasedChoices.length >= 3) {
      achievements.push('premium_supporter');
    }

    if (progress.purchasedChoices.length >= 5) {
      achievements.push('content_enthusiast');
    }

    return achievements;
  }

  private static addCompletedPage(completedPages: string[], newPageId: string): string[] {
    if (completedPages.includes(newPageId)) {
      return completedPages;
    }
    return [...completedPages, newPageId];
  }
}