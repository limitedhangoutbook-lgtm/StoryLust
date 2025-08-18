import type { StoryDataProvider } from '../../shared/story-engine/StoryEngine';
import type {
  StoryPage,
  StoryChoice,
  StoryMetadata,
  UserProgress
} from '../../shared/story-engine/types/EngineTypes';
import { storage } from '../storage';

/**
 * Database adapter for StoryEngine - connects modular engine to existing storage
 * Translates between engine types and current database schema
 */
export class DatabaseStoryProvider implements StoryDataProvider {

  async getUserProgress(userId: string, storyId: string): Promise<UserProgress | null> {
    try {
      const progress = await storage.getReadingProgress(userId, storyId);
      if (!progress) return null;

      // Get current page by page number - need to find the page ID
      const pages = await storage.getStoryPages(storyId);
      const currentPage = pages.find(p => p.order === progress.currentPage);
      
      // Get purchased choices - for now use empty array until getUserChoices is implemented
      const purchasedChoices: any[] = [];

      // Convert database format to engine format
      return {
        userId,
        storyId,
        currentPageId: currentPage?.id || '',
        completedPages: [], // Will build this from pagesRead count
        purchasedChoices: purchasedChoices.map((choice: any) => choice.choiceId),
        lastReadAt: progress.lastReadAt || new Date()
      };
    } catch (error) {
      return null;
    }
  }

  async saveUserProgress(progress: UserProgress): Promise<void> {
    try {
      // Find page number from page ID
      const pages = await storage.getStoryPages(progress.storyId);
      const currentPage = pages.find(p => p.id === progress.currentPageId);
      const pageNumber = currentPage?.order || 1;

      // Convert engine format to database format
      await storage.saveReadingProgress({
        id: `${progress.userId}-${progress.storyId}`,
        userId: progress.userId,
        storyId: progress.storyId,
        currentPage: pageNumber,
        pagesRead: progress.completedPages.length,
        choicesMade: progress.purchasedChoices.length,
        lastReadAt: progress.lastReadAt,
        isCompleted: false // Will be determined by story engine
      });
    } catch (error) {
      throw error;
    }
  }

  async getUserEggplants(userId: string): Promise<number> {
    try {
      const user = await storage.getUser(userId);
      return user?.eggplants || 0;
    } catch (error) {
      return 0;
    }
  }

  async deductEggplants(userId: string, amount: number): Promise<void> {
    try {
      await storage.addEggplantsToUser(userId, -amount);
    } catch (error) {
      throw error;
    }
  }

  async getPage(pageId: string): Promise<StoryPage> {
    try {
      const page = await storage.getStoryPage(pageId);
      if (!page) {
        throw new Error(`Page not found: ${pageId}`);
      }

      // Convert database format to engine format
      return {
        id: page.id,
        storyId: page.storyId,
        pageNumber: page.order,
        content: page.content,
        isEnding: !page.nextPageId && page.pageType !== 'choice' // No next page = ending
      };
    } catch (error) {
      throw error;
    }
  }

  async getChoice(choiceId: string): Promise<StoryChoice | null> {
    try {
      const choice = await storage.getChoice(choiceId);
      if (!choice) return null;

      // Convert database format to engine format
      return {
        id: choice.id,
        fromPageId: choice.fromPageId,
        toPageId: choice.toPageId,
        choiceText: choice.choiceText,
        isPremium: choice.isPremium || false,
        eggplantCost: choice.eggplantCost || 0,
        description: choice.choiceText // Use choiceText as description
      };
    } catch (error) {
      return null;
    }
  }

  async getChoicesFromPage(pageId: string): Promise<StoryChoice[]> {
    try {
      // First get the page to find its story and order
      const page = await storage.getStoryPage(pageId);
      if (!page) return [];
      
      const choices = await storage.getChoicesForPage(page.order, page.storyId);
      
      // Convert database format to engine format
      return choices.map(choice => ({
        id: choice.id,
        fromPageId: choice.fromPageId,
        toPageId: choice.toPageId,
        choiceText: choice.choiceText,
        isPremium: choice.isPremium || false,
        eggplantCost: choice.eggplantCost || 0,
        description: choice.choiceText // Use choiceText as description
      }));
    } catch (error) {
      return [];
    }
  }

  async getFirstPageId(storyId: string): Promise<string> {
    try {
      const story = await storage.getStory(storyId);
      if (!story) {
        throw new Error(`Story not found: ${storyId}`);
      }

      // Get first page (order = 1)
      const pages = await storage.getStoryPages(storyId);
      const firstPage = pages.find(p => p.order === 1);
      
      if (!firstPage) {
        throw new Error(`No first page found for story: ${storyId}`);
      }

      return firstPage.id;
    } catch (error) {
      throw error;
    }
  }

  async getStoryMetadata(storyId: string): Promise<StoryMetadata> {
    try {
      const story = await storage.getStory(storyId);
      if (!story) {
        throw new Error(`Story not found: ${storyId}`);
      }

      const pages = await storage.getStoryPages(storyId);

      // Convert database format to engine format
      return {
        id: story.id,
        title: story.title,
        description: story.description || '',
        category: story.category || 'general',
        spiceLevel: story.spiceLevel || 1,
        totalPages: pages.length,
        author: 'WildBranch', // Default author since not in schema
        coverImage: story.imageUrl
      };
    } catch (error) {
      throw error;
    }
  }
}