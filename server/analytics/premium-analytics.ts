import { storage } from '../storage';

export interface PremiumChoiceEvent {
  userId?: string;
  sessionId?: string;
  storyId: string;
  nodeId: string;
  choiceId: string;
  eventType: 'view' | 'tap' | 'purchase_attempt' | 'purchase_success' | 'purchase_cancel';
  userEggplants: number;
  choiceCost: number;
  hasEnoughFunds: boolean;
  timestamp: Date;
  metadata?: {
    paymentIntentId?: string;
    cancelReason?: string;
    previewMode?: boolean;
  };
}

export interface PremiumAnalytics {
  storyId: string;
  nodeId: string;
  choiceId: string;
  totalReaders: number;
  premiumViews: number;
  premiumTaps: number;
  purchaseAttempts: number;
  purchaseSuccesses: number;
  premiumInterestRate: number; // taps ÷ views
  purchaseCompletionRate: number; // successes ÷ taps
  averageEggplantsAtFork: number;
  fundedUserTaps: number; // users who had enough eggplants
  unfundedUserTaps: number; // users who didn't have enough
}

class PremiumAnalyticsService {
  
  // Log premium choice events
  async logPremiumEvent(event: PremiumChoiceEvent): Promise<void> {
    try {
      // Store in database for analysis
      await storage.logAnalyticsEvent('premium_choice', event);
      
      // Real-time console logging for development
      console.log(`[PREMIUM ANALYTICS] ${event.eventType.toUpperCase()}:`, {
        story: event.storyId,
        choice: event.choiceId,
        user: event.userId || 'guest',
        funds: `${event.userEggplants}/${event.choiceCost}`,
        canAfford: event.hasEnoughFunds
      });
      
    } catch (error) {
      console.error('Failed to log premium analytics:', error);
      // Don't throw - analytics shouldn't break core functionality
    }
  }

  // Track when user views a premium choice
  async trackPremiumView(params: {
    userId?: string;
    sessionId?: string;
    storyId: string;
    nodeId: string;
    choiceId: string;
    userEggplants: number;
    choiceCost: number;
  }): Promise<void> {
    await this.logPremiumEvent({
      ...params,
      eventType: 'view',
      hasEnoughFunds: params.userEggplants >= params.choiceCost,
      timestamp: new Date()
    });
  }

  // Track when user taps premium choice (shows interest)
  async trackPremiumTap(params: {
    userId?: string;
    sessionId?: string;
    storyId: string;
    nodeId: string;
    choiceId: string;
    userEggplants: number;
    choiceCost: number;
    previewMode?: boolean;
  }): Promise<void> {
    await this.logPremiumEvent({
      ...params,
      eventType: 'tap',
      hasEnoughFunds: params.userEggplants >= params.choiceCost,
      timestamp: new Date(),
      metadata: {
        previewMode: params.previewMode || false
      }
    });
  }

  // Track purchase attempt (Stripe payment intent created)
  async trackPurchaseAttempt(params: {
    userId: string;
    sessionId?: string;
    storyId: string;
    nodeId: string;
    choiceId: string;
    userEggplants: number;
    choiceCost: number;
    paymentIntentId: string;
  }): Promise<void> {
    await this.logPremiumEvent({
      ...params,
      eventType: 'purchase_attempt',
      hasEnoughFunds: params.userEggplants >= params.choiceCost,
      timestamp: new Date(),
      metadata: {
        paymentIntentId: params.paymentIntentId
      }
    });
  }

  // Track successful purchase
  async trackPurchaseSuccess(params: {
    userId: string;
    sessionId?: string;
    storyId: string;
    nodeId: string;
    choiceId: string;
    userEggplants: number;
    choiceCost: number;
  }): Promise<void> {
    await this.logPremiumEvent({
      ...params,
      eventType: 'purchase_success',
      hasEnoughFunds: true, // They must have had funds to complete
      timestamp: new Date()
    });
  }

  // Track purchase cancellation
  async trackPurchaseCancel(params: {
    userId?: string;
    sessionId?: string;
    storyId: string;
    nodeId: string;
    choiceId: string;
    userEggplants: number;
    choiceCost: number;
    cancelReason?: string;
  }): Promise<void> {
    await this.logPremiumEvent({
      ...params,
      eventType: 'purchase_cancel',
      hasEnoughFunds: params.userEggplants >= params.choiceCost,
      timestamp: new Date(),
      metadata: {
        cancelReason: params.cancelReason
      }
    });
  }

  // Generate analytics report for a specific choice
  async getPremiumAnalytics(storyId: string, choiceId?: string): Promise<PremiumAnalytics[]> {
    try {
      return await storage.getPremiumChoiceAnalytics(storyId, choiceId);
    } catch (error) {
      console.error('Failed to get premium analytics:', error);
      return [];
    }
  }

  // A/B Testing: Set user's initial eggplant balance
  async setTestUserBalance(userId: string, balance: number, testGroup: string): Promise<void> {
    try {
      await storage.updateUserEggplants(userId, balance);
      await storage.logAnalyticsEvent('ab_test_assignment', {
        userId,
        testGroup,
        initialBalance: balance,
        timestamp: new Date()
      });
      
      console.log(`[A/B TEST] User ${userId} assigned to ${testGroup} with ${balance} eggplants`);
    } catch (error) {
      console.error('Failed to set test user balance:', error);
    }
  }

  // Preview mode toggle for testing interest without payments
  async enablePreviewMode(userId: string, storyId: string): Promise<void> {
    try {
      await storage.logAnalyticsEvent('preview_mode_enabled', {
        userId,
        storyId,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Failed to log preview mode:', error);
    }
  }
}

export const premiumAnalytics = new PremiumAnalyticsService();