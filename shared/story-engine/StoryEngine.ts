import type { 
  NavigationRequest,
  NavigationResult,
  StorySession,
  EngineConfig,
  StoryPage,
  StoryChoice,
  StoryMetadata,
  UserProgress
} from './types/EngineTypes';
import { ChoiceEvaluator } from './ChoiceEvaluator';
import { ProgressTracker } from './ProgressTracker';

/**
 * Core Story Engine - Handles all story navigation logic
 * Isolated from database operations and UI concerns
 */
export class StoryEngine {
  private config: EngineConfig;

  constructor(config: Partial<EngineConfig> = {}) {
    this.config = {
      enableAnalytics: true,
      enableTensionMechanics: true,
      defaultChoiceDelay: 500,
      maxChoicesPerPage: 6,
      ...config
    };
  }

  /**
   * Main navigation method - handles moving through story
   * Returns complete session state for UI rendering
   */
  async navigate(
    request: NavigationRequest,
    dataProvider: StoryDataProvider
  ): Promise<NavigationResult> {
    try {
      // Get current user progress
      const userProgress = await dataProvider.getUserProgress(request.userId, request.storyId);
      const userEggplants = await dataProvider.getUserEggplants(request.userId);

      // Determine target page
      let targetPage: StoryPage;
      
      if (request.choiceId) {
        // User made a choice - validate and process
        const choice = await dataProvider.getChoice(request.choiceId);
        if (!choice) {
          return { success: false, session: null as any, error: 'Invalid choice' };
        }

        // Check if premium choice needs purchase
        const currentProgress = userProgress || this.createInitialProgress(request.userId, request.storyId, '');
        const evaluation = ChoiceEvaluator.evaluateChoices([choice], currentProgress, userEggplants)[0];
        
        if (evaluation.requiresPurchase && !evaluation.isAccessible) {
          return { 
            success: false, 
            session: null as any, 
            error: 'Insufficient eggplants for premium choice' 
          };
        }

        // Handle premium purchase if needed
        if (evaluation.requiresPurchase && evaluation.isAccessible) {
          const purchaseResult = ProgressTracker.recordPurchase(currentProgress, request.choiceId);
          await dataProvider.saveUserProgress(purchaseResult.progress);
          await dataProvider.deductEggplants(request.userId, choice.eggplantCost);
        }

        targetPage = await dataProvider.getPage(choice.toPageId);
      } else if (request.targetPageId) {
        // Direct page navigation
        targetPage = await dataProvider.getPage(request.targetPageId);
      } else {
        // Get current page or start of story
        const pageId = userProgress?.currentPageId || await dataProvider.getFirstPageId(request.storyId);
        targetPage = await dataProvider.getPage(pageId);
      }

      // Update progress
      const progressResult = ProgressTracker.updateProgress(
        userProgress || this.createInitialProgress(request.userId, request.storyId, targetPage.id),
        targetPage,
        request.choiceId
      );

      await dataProvider.saveUserProgress(progressResult.progress);

      // Get available choices for this page
      const availableChoices = await dataProvider.getChoicesFromPage(targetPage.id);
      const choiceEvaluations = ChoiceEvaluator.evaluateChoices(
        availableChoices,
        progressResult.progress,
        userEggplants
      );

      // Get story metadata
      const metadata = await dataProvider.getStoryMetadata(request.storyId);

      // Build session state
      const session: StorySession = {
        storyId: request.storyId,
        currentPage: targetPage,
        availableChoices: choiceEvaluations,
        progress: progressResult.progress,
        metadata
      };

      return {
        success: true,
        session,
        analyticsEvent: progressResult.analyticsEvent
      };

    } catch (error) {
      return {
        success: false,
        session: null as any,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Gets tension metrics for current session (used by enhanced UX)
   */
  getTensionMetrics(session: StorySession) {
    if (!this.config.enableTensionMechanics) {
      return null;
    }

    return ChoiceEvaluator.calculateTensionMetrics(
      session.availableChoices,
      session.progress
    );
  }

  private createInitialProgress(userId: string, storyId: string, currentPageId: string): UserProgress {
    return {
      userId,
      storyId,
      currentPageId,
      completedPages: [],
      purchasedChoices: [],
      lastReadAt: new Date()
    };
  }
}

/**
 * Data provider interface - implemented by storage layer
 * Allows story engine to be database-agnostic
 */
export interface StoryDataProvider {
  getUserProgress(userId: string, storyId: string): Promise<UserProgress | null>;
  saveUserProgress(progress: UserProgress): Promise<void>;
  getUserEggplants(userId: string): Promise<number>;
  deductEggplants(userId: string, amount: number): Promise<void>;
  
  getPage(pageId: string): Promise<StoryPage>;
  getChoice(choiceId: string): Promise<StoryChoice | null>;
  getChoicesFromPage(pageId: string): Promise<StoryChoice[]>;
  getFirstPageId(storyId: string): Promise<string>;
  getStoryMetadata(storyId: string): Promise<StoryMetadata>;
}