import { db } from "../db";
import { and, eq, gte, sql, desc } from "drizzle-orm";
import { 
  userChoices, 
  readingProgress, 
  purchasedPremiumPaths, 
  stories, 
  storyChoices,
  users,
  readingSessions 
} from "@shared/schema";

export interface PremiumChoiceAnalytics {
  choiceId: string;
  storyId: string;
  choiceText: string;
  totalViews: number;
  purchaseRate: number;
  conversionRate: number;
  averageEggplantCost: number;
  revenueGenerated: number;
}

export interface UserBehaviorMetrics {
  userId: string;
  totalStoriesRead: number;
  totalChoicesMade: number;
  premiumChoicesPurchased: number;
  averageReadingSessionLength: number;
  engagementScore: number;
  churnRisk: 'low' | 'medium' | 'high';
}

export interface ContentPerformance {
  storyId: string;
  title: string;
  totalReaders: number;
  completionRate: number;
  premiumConversionRate: number;
  averageReadingTime: number;
  popularChoices: string[];
}

export class AdvancedAnalytics {
  
  // Premium choice performance analysis
  async getPremiumChoiceAnalytics(timeRange: number = 30): Promise<PremiumChoiceAnalytics[]> {
    const cutoffDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000);
    
    const results = await db
      .select({
        choiceId: storyChoices.id,
        storyId: storyChoices.fromPageId,
        choiceText: storyChoices.choiceText,
        eggplantCost: storyChoices.eggplantCost,
        totalViews: sql<number>`count(distinct ${userChoices.userId})`,
        totalPurchases: sql<number>`count(distinct ${purchasedPremiumPaths.userId})`,
        revenueGenerated: sql<number>`sum(${purchasedPremiumPaths.eggplantCost})`
      })
      .from(storyChoices)
      .leftJoin(userChoices, eq(storyChoices.id, userChoices.choiceId))
      .leftJoin(purchasedPremiumPaths, eq(storyChoices.id, purchasedPremiumPaths.choiceId))
      .where(
        and(
          eq(storyChoices.isPremium, true),
          gte(userChoices.createdAt, cutoffDate)
        )
      )
      .groupBy(storyChoices.id, storyChoices.choiceText, storyChoices.eggplantCost, storyChoices.fromPageId);

    return results.map(result => ({
      choiceId: result.choiceId,
      storyId: result.storyId,
      choiceText: result.choiceText,
      totalViews: result.totalViews || 0,
      purchaseRate: result.totalViews > 0 ? (result.totalPurchases || 0) / result.totalViews : 0,
      conversionRate: result.totalViews > 0 ? (result.totalPurchases || 0) / result.totalViews : 0,
      averageEggplantCost: result.eggplantCost || 0,
      revenueGenerated: result.revenueGenerated || 0
    }));
  }

  // User behavior and engagement metrics
  async getUserBehaviorMetrics(userId: string): Promise<UserBehaviorMetrics> {
    const [userStats] = await db
      .select({
        totalStoriesRead: sql<number>`count(distinct ${readingProgress.storyId})`,
        totalChoicesMade: sql<number>`count(${userChoices.id})`,
        premiumChoicesPurchased: sql<number>`count(${purchasedPremiumPaths.id})`,
        averageSessionLength: sql<number>`avg(extract(epoch from (${readingSessions.endTime} - ${readingSessions.startTime})))`
      })
      .from(users)
      .leftJoin(readingProgress, eq(users.id, readingProgress.userId))
      .leftJoin(userChoices, eq(users.id, userChoices.userId))
      .leftJoin(purchasedPremiumPaths, eq(users.id, purchasedPremiumPaths.userId))
      .leftJoin(readingSessions, eq(users.id, readingSessions.userId))
      .where(eq(users.id, userId));

    const engagementScore = this.calculateEngagementScore(userStats);
    const churnRisk = this.assessChurnRisk(userStats);

    return {
      userId,
      totalStoriesRead: userStats.totalStoriesRead || 0,
      totalChoicesMade: userStats.totalChoicesMade || 0,
      premiumChoicesPurchased: userStats.premiumChoicesPurchased || 0,
      averageReadingSessionLength: userStats.averageSessionLength || 0,
      engagementScore,
      churnRisk
    };
  }

  // Content performance analysis
  async getContentPerformance(timeRange: number = 30): Promise<ContentPerformance[]> {
    const cutoffDate = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000);
    
    const results = await db
      .select({
        storyId: stories.id,
        title: stories.title,
        totalReaders: sql<number>`count(distinct ${readingProgress.userId})`,
        completedReaders: sql<number>`count(distinct case when ${readingProgress.isCompleted} then ${readingProgress.userId} end)`,
        premiumPurchases: sql<number>`count(distinct ${purchasedPremiumPaths.userId})`,
        averageReadingTime: sql<number>`avg(${readingProgress.totalReadingTimeMinutes})`
      })
      .from(stories)
      .leftJoin(readingProgress, eq(stories.id, readingProgress.storyId))
      .leftJoin(purchasedPremiumPaths, eq(stories.id, purchasedPremiumPaths.storyId))
      .where(gte(readingProgress.createdAt, cutoffDate))
      .groupBy(stories.id, stories.title);

    return results.map(result => ({
      storyId: result.storyId,
      title: result.title,
      totalReaders: result.totalReaders || 0,
      completionRate: result.totalReaders > 0 ? (result.completedReaders || 0) / result.totalReaders : 0,
      premiumConversionRate: result.totalReaders > 0 ? (result.premiumPurchases || 0) / result.totalReaders : 0,
      averageReadingTime: result.averageReadingTime || 0,
      popularChoices: [] // TODO: Implement popular choices analysis
    }));
  }

  // A/B testing support
  async trackABTestEvent(userId: string, testName: string, variant: string, event: string) {
    // Store A/B test events for analysis
    // This could be in a separate analytics table or sent to external service
    console.log(`A/B Test: ${testName}, User: ${userId}, Variant: ${variant}, Event: ${event}`);
  }

  // Calculate engagement score based on user activity
  private calculateEngagementScore(userStats: any): number {
    const {
      totalStoriesRead = 0,
      totalChoicesMade = 0,
      premiumChoicesPurchased = 0,
      averageSessionLength = 0
    } = userStats;

    // Weighted scoring system
    const storyWeight = 10;
    const choiceWeight = 2;
    const premiumWeight = 50;
    const sessionWeight = 0.1;

    return Math.min(100, 
      (totalStoriesRead * storyWeight) +
      (totalChoicesMade * choiceWeight) +
      (premiumChoicesPurchased * premiumWeight) +
      (averageSessionLength * sessionWeight)
    );
  }

  // Assess churn risk based on recent activity
  private assessChurnRisk(userStats: any): 'low' | 'medium' | 'high' {
    const { averageSessionLength = 0, totalChoicesMade = 0 } = userStats;
    
    if (averageSessionLength > 1800 && totalChoicesMade > 20) return 'low'; // 30+ min sessions, active
    if (averageSessionLength > 600 && totalChoicesMade > 5) return 'medium'; // 10+ min sessions, moderate
    return 'high'; // Short sessions or low activity
  }

  // Performance optimization: precompute analytics
  async generateDailyAnalyticsReport() {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    
    // Generate and cache daily metrics
    const premiumMetrics = await this.getPremiumChoiceAnalytics(1);
    const contentMetrics = await this.getContentPerformance(1);
    
    // Store in cache or analytics table for fast retrieval
    console.log('Daily analytics generated:', {
      premiumChoices: premiumMetrics.length,
      stories: contentMetrics.length,
      date: today.toISOString()
    });
  }
}

export const advancedAnalytics = new AdvancedAnalytics();