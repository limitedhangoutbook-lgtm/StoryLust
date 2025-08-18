import { db } from "./db";
import { eq, desc, and, sql, asc, inArray } from "drizzle-orm";
import {
  users,
  stories,
  storyPages,
  storyChoices,
  readingProgress,
  userChoices,
  personalBookmarks,
  readingSessions,
  purchasedPremiumPaths,
  endingCards,
  userEndingCards,
  type User,
  type UpsertUser,
  type Story,
  type StoryPage,
  type StoryChoice,
  type ReadingProgress,
  type InsertReadingProgress,
  type InsertUserChoice,
  type PersonalBookmark,
  type InsertPersonalBookmark,
  type ReadingSession,
  type InsertReadingSession,
  type EndingCard,
  type InsertEndingCard,
  type UserEndingCard,
  type InsertUserEndingCard,

} from "@shared/schema";

export class Storage {
  // === USER OPERATIONS ===
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        eggplants: userData.eggplants ?? (userData.role === 'mega-admin' ? 999 : 20), // Give mega-admin 999 eggplants
      })
      .onConflictDoUpdate({
        target: users.id,
        set: { 
          ...userData, 
          updatedAt: new Date(),
          // Don't overwrite eggplants on existing users unless explicitly provided
          eggplants: userData.eggplants !== undefined ? userData.eggplants : sql`${users.eggplants}`,
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async updateUserEggplants(userId: string, eggplants: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ eggplants, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async addEggplantsToUser(userId: string, eggplantsToAdd: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        eggplants: sql`COALESCE(${users.eggplants}, 0) + ${eggplantsToAdd}`,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async updateUserRole(userId: string, role: "guest" | "registered" | "admin" | "mega-admin"): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // === STORY OPERATIONS ===
  async getAllStories(): Promise<Story[]> {
    return await db
      .select()
      .from(stories)
      .where(eq(stories.isPublished, true))
      .orderBy(desc(stories.isFeatured), stories.createdAt);
  }

  async getStoryPages(storyId: string): Promise<StoryPage[]> {
    return await db
      .select()
      .from(storyPages)
      .where(eq(storyPages.storyId, storyId))
      .orderBy(storyPages.order);
  }

  async getFirstChoicePageNumber(storyId: string): Promise<number | null> {
    // Find the first page that has choices by joining with story_choices
    const result = await db
      .select({ 
        pageOrder: storyPages.order 
      })
      .from(storyPages)
      .innerJoin(storyChoices, eq(storyPages.id, storyChoices.fromPageId))
      .where(eq(storyPages.storyId, storyId))
      .orderBy(storyPages.order)
      .limit(1);
    
    return result.length > 0 ? result[0].pageOrder : null;
  }

  async getAllStoriesForAdmin(): Promise<Story[]> {
    return await db
      .select()
      .from(stories)
      .orderBy(desc(stories.isFeatured), desc(stories.createdAt));
  }

  async createStory(storyData: {
    title: string;
    description: string;
    imageUrl: string;
    spiceLevel: number;
    category: string;
    wordCount?: number;
    pathCount?: number;
  }): Promise<Story> {
    const [story] = await db
      .insert(stories)
      .values({
        ...storyData,
        wordCount: storyData.wordCount || 0,
        pathCount: storyData.pathCount || 1,
        isPublished: false, // Start as draft
        isFeatured: false,
      })
      .returning();
    return story;
  }

  async updateStory(storyId: string, updates: Partial<Story>): Promise<Story> {
    const [story] = await db
      .update(stories)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(stories.id, storyId))
      .returning();
    return story;
  }

  async deleteStory(storyId: string): Promise<void> {
    await db.delete(stories).where(eq(stories.id, storyId));
  }

  // NEW: Create complete story from visual timeline data
  async createStoryFromTimeline(timelineData: {
    story: {
      title: string;
      description: string;
      imageUrl: string;
      spiceLevel: number;
      category: string;
      isFeatured?: boolean;
      isPublished?: boolean;
    };
    pages: Array<{
      id: string;
      title: string;
      content: string;
      order: number;
      pageType: "story" | "choice";
      endingCard?: {
        cardTitle: string;
        cardSubtitle: string;
        cardDescription: string;
        cardImageUrl: string;
        rarity: "ember" | "flame" | "inferno";
        emotionTag: string;
        unlockCondition: string;
      };
      choices?: Array<{
        id: string;
        text: string;
        isPremium: boolean;
        eggplantCost: number;
        targetPageId: string;
      }>;
    }>;
  }): Promise<Story> {
    // Calculate word and path counts
    const wordCount = timelineData.pages.reduce((total, page) => {
      return total + page.content.split(' ').filter(w => w.length > 0).length;
    }, 0);
    
    const pathCount = timelineData.pages.reduce((total, page) => {
      return total + (page.choices?.length || 0);
    }, 0);

    // Create the story
    const story = await this.createStory({
      ...timelineData.story,
      wordCount,
      pathCount,
    });

    // Create all the pages as story pages
    const nodeMap = new Map<string, string>(); // pageId -> pageId mapping
    
    for (const page of timelineData.pages) {
      const node = await this.createStoryPage({
        storyId: story.id,
        title: page.title,
        content: page.content,
        order: page.order,
        isStarting: page.order === 1,
      });
      nodeMap.set(page.id, node.id);
    }

    // Create all the choices with proper node references
    for (const page of timelineData.pages) {
      if (page.choices && page.choices.length > 0) {
        const fromPageId = nodeMap.get(page.id);
        if (!fromPageId) continue;

        for (let i = 0; i < page.choices.length; i++) {
          const choice = page.choices[i];
          const toPageId = nodeMap.get(choice.targetPageId);
          
          if (toPageId) {
            await this.createStoryChoice({
              fromPageId,
              toPageId,
              choiceText: choice.text,
              order: i,
              isPremium: choice.isPremium,
              eggplantCost: choice.eggplantCost,
              targetPageId: choice.targetPageId, // Store original page reference for new system
            });
          }
        }
      }
    }

    // Create ending cards for pages that have ending card data
    for (const page of timelineData.pages) {
      if (page.endingCard) {
        const pageId = nodeMap.get(page.id);
        if (pageId) {
          await this.createEndingCard({
            storyId: story.id,
            pageId: pageId,
            cardTitle: page.endingCard.cardTitle,
            cardSubtitle: page.endingCard.cardSubtitle,
            cardDescription: page.endingCard.cardDescription,
            cardImageUrl: page.endingCard.cardImageUrl || '',
            rarity: page.endingCard.rarity,
            emotionTag: page.endingCard.emotionTag,
            unlockCondition: page.endingCard.unlockCondition,
          });
        }
      }
    }

    return story;
  }

  async createStoryPage(nodeData: {
    storyId: string;
    title: string;
    content: string;
    order: number;
    isStarting?: boolean;
  }): Promise<StoryPage> {
    const [node] = await db
      .insert(storyPages)
      .values({
        ...nodeData,
        isStarting: nodeData.isStarting || false,
      })
      .returning();
    return node;
  }

  async updateStoryPage(pageId: string, updates: Partial<StoryPage>): Promise<StoryPage> {
    const [node] = await db
      .update(storyPages)
      .set(updates)
      .where(eq(storyPages.id, pageId))
      .returning();
    return node;
  }

  async deleteStoryPage(pageId: string): Promise<void> {
    await db.delete(storyPages).where(eq(storyPages.id, pageId));
  }

  async createStoryChoice(choiceData: {
    fromPageId: string;
    toPageId: string;
    choiceText: string;
    order?: number;
    isPremium?: boolean;
    eggplantCost?: number;
    targetPage?: number; // PAGE-BASED NAVIGATION SUPPORT
    targetPageId?: string; // NEW VISUAL TIMELINE SUPPORT
  }): Promise<StoryChoice> {
    const [choice] = await db
      .insert(storyChoices)
      .values({
        fromPageId: choiceData.fromPageId,
        toPageId: choiceData.toPageId,
        choiceText: choiceData.choiceText,
        order: choiceData.order || 0,
        isPremium: choiceData.isPremium || false,
        eggplantCost: choiceData.eggplantCost || 0,
        targetPage: choiceData.targetPage, // PAGE-BASED NAVIGATION
        targetPageId: choiceData.targetPageId, // NEW VISUAL TIMELINE SUPPORT
      })
      .returning();
    return choice;
  }

  async updateStoryChoice(choiceId: string, updates: Partial<StoryChoice>): Promise<StoryChoice> {
    const [choice] = await db
      .update(storyChoices)
      .set(updates)
      .where(eq(storyChoices.id, choiceId))
      .returning();
    return choice;
  }

  async deleteStoryChoice(choiceId: string): Promise<void> {
    await db.delete(storyChoices).where(eq(storyChoices.id, choiceId));
  }

  async getFeaturedStory(): Promise<Story | undefined> {
    const [story] = await db
      .select()
      .from(stories)
      .where(and(eq(stories.isFeatured, true), eq(stories.isPublished, true)))
      .limit(1);
    return story;
  }

  async getStory(id: string): Promise<Story | undefined> {
    const [story] = await db.select().from(stories).where(eq(stories.id, id));
    return story;
  }

  // === STORY PAGE OPERATIONS ===

  async getFirstStoryPage(storyId: string): Promise<StoryPage | undefined> {
    const [node] = await db
      .select()
      .from(storyPages)
      .where(eq(storyPages.storyId, storyId))
      .orderBy(storyPages.order)
      .limit(1);
    return node;
  }

  // === STORY CHOICE OPERATIONS ===
  async getChoicesForPage(pageNumber: number, storyId: string): Promise<StoryChoice[]> {
    // Get the page at this position
    const allPages = await this.getStoryPages(storyId);
    const pageIndex = pageNumber - 1;
    if (pageIndex < 0 || pageIndex >= allPages.length) return [];
    
    const currentPage = allPages[pageIndex];
    return await db
      .select()
      .from(storyChoices)
      .where(eq(storyChoices.fromPageId, currentPage.id))
      .orderBy(storyChoices.order);
  }

  async getChoice(choiceId: string): Promise<StoryChoice | undefined> {
    const [choice] = await db.select().from(storyChoices).where(eq(storyChoices.id, choiceId));
    return choice;
  }

  async getStoryPage(pageId: string): Promise<StoryPage | undefined> {
    const [page] = await db.select().from(storyPages).where(eq(storyPages.id, pageId));
    return page;
  }

  // === READING PROGRESS OPERATIONS ===
  async getReadingProgress(userId: string, storyId: string): Promise<ReadingProgress | undefined> {
    const [progress] = await db
      .select()
      .from(readingProgress)
      .where(and(
        eq(readingProgress.userId, userId),
        eq(readingProgress.storyId, storyId)
      ));
    return progress;
  }

  async saveReadingProgress(progressData: InsertReadingProgress): Promise<ReadingProgress> {
    const [progress] = await db
      .insert(readingProgress)
      .values(progressData)
      .onConflictDoUpdate({
        target: [readingProgress.userId, readingProgress.storyId],
        set: {
          currentPage: progressData.currentPage, // PAGE-BASED ONLY
          isBookmarked: progressData.isBookmarked,
          isCompleted: progressData.isCompleted,
          completedAt: progressData.completedAt,
          pagesRead: progressData.pagesRead,
          choicesMade: progressData.choicesMade,
          lastReadAt: new Date(),
        },
      })
      .returning();
    return progress;
  }

  async markStoryCompleted(userId: string, storyId: string): Promise<ReadingProgress> {
    const [progress] = await db
      .insert(readingProgress)
      .values({
        userId,
        storyId,
        currentPage: 1, // Will be overridden by conflict update
        isCompleted: true,
        completedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [readingProgress.userId, readingProgress.storyId],
        set: {
          isCompleted: true,
          completedAt: new Date(),
        },
      })
      .returning();
    return progress;
  }

  async getUserStats(userId: string): Promise<{
    storiesStarted: number;
    storiesCompleted: number;
    totalChoicesMade: number;
    bookmarkedStories: number;
    premiumChoicesUnlocked: number;
    eggplantsSpent: number;
  }> {
    // Count stories started (reading progress exists)
    const [startedResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(readingProgress)
      .where(eq(readingProgress.userId, userId));
    
    // Count stories completed  
    const [completedResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(readingProgress)
      .where(and(
        eq(readingProgress.userId, userId),
        eq(readingProgress.isCompleted, true)
      ));

    // Count bookmarked stories
    const [bookmarkedResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(readingProgress)
      .where(and(
        eq(readingProgress.userId, userId),
        eq(readingProgress.isBookmarked, true)
      ));

    // Count total choices made
    const [choicesResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(userChoices)
      .where(eq(userChoices.userId, userId));

    // Count premium choices (join with story choices to check isPremium)
    const [premiumResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(userChoices)
      .innerJoin(storyChoices, eq(userChoices.choiceId, storyChoices.id))
      .where(and(
        eq(userChoices.userId, userId),
        eq(storyChoices.isPremium, true)
      ));

    // Get user for eggplants spent (would need transaction history for real calculation)
    const user = await this.getUser(userId);
    
    return {
      storiesStarted: startedResult?.count || 0,
      storiesCompleted: completedResult?.count || 0,
      totalChoicesMade: choicesResult?.count || 0,
      bookmarkedStories: bookmarkedResult?.count || 0,
      premiumChoicesUnlocked: premiumResult?.count || 0,
      eggplantsSpent: 0, // Would need transaction history
    };
  }

  async getUserReadingProgressWithStories(userId: string): Promise<Array<ReadingProgress & { story: Story }>> {
    const progressData = await db
      .select()
      .from(readingProgress)
      .innerJoin(stories, eq(readingProgress.storyId, stories.id))
      .where(eq(readingProgress.userId, userId))
      .orderBy(desc(readingProgress.lastReadAt));

    return progressData.map(row => ({
      ...row.reading_progress,
      story: row.stories,
    }));
  }

  // === USER CHOICE OPERATIONS ===
  async saveUserChoice(choiceData: InsertUserChoice): Promise<{ success: boolean }> {
    await db.insert(userChoices).values(choiceData);
    return { success: true };
  }

  async getUserChoiceHistory(userId: string, storyId: string): Promise<any[]> {
    return await db
      .select()
      .from(userChoices)
      .where(and(
        eq(userChoices.userId, userId),
        eq(userChoices.storyId, storyId)
      ))
      .orderBy(userChoices.createdAt);
  }

  // === PERSONAL BOOKMARK OPERATIONS ===
  async createPersonalBookmark(bookmarkData: InsertPersonalBookmark): Promise<PersonalBookmark> {
    const [bookmark] = await db
      .insert(personalBookmarks)
      .values(bookmarkData)
      .returning();
    return bookmark;
  }

  async getPersonalBookmarks(userId: string, storyId?: string): Promise<PersonalBookmark[]> {
    const conditions = [eq(personalBookmarks.userId, userId)];
    if (storyId) {
      conditions.push(eq(personalBookmarks.storyId, storyId));
    }
    
    return await db
      .select({
        id: personalBookmarks.id,
        userId: personalBookmarks.userId,
        storyId: personalBookmarks.storyId,
        pageId: personalBookmarks.pageId,
        title: personalBookmarks.title,
        notes: personalBookmarks.notes,
        isPrivate: personalBookmarks.isPrivate,
        createdAt: personalBookmarks.createdAt,
        updatedAt: personalBookmarks.updatedAt,
        // Include story and page details
        storyTitle: stories.title,
        pageTitle: storyPages.title,
      })
      .from(personalBookmarks)
      .leftJoin(stories, eq(personalBookmarks.storyId, stories.id))
      .leftJoin(storyPages, eq(personalBookmarks.pageId, storyPages.id))
      .where(and(...conditions))
      .orderBy(desc(personalBookmarks.createdAt));
  }

  async updatePersonalBookmark(bookmarkId: string, updates: Partial<PersonalBookmark>): Promise<PersonalBookmark> {
    const [bookmark] = await db
      .update(personalBookmarks)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(personalBookmarks.id, bookmarkId))
      .returning();
    return bookmark;
  }

  async deletePersonalBookmark(bookmarkId: string): Promise<void> {
    await db.delete(personalBookmarks).where(eq(personalBookmarks.id, bookmarkId));
  }

  // === READING SESSION OPERATIONS ===
  async startReadingSession(sessionData: InsertReadingSession): Promise<ReadingSession> {
    // End any existing active sessions for this user/story
    await db
      .update(readingSessions)
      .set({ isActive: false, endTime: new Date() })
      .where(and(
        eq(readingSessions.userId, sessionData.userId),
        eq(readingSessions.storyId, sessionData.storyId),
        eq(readingSessions.isActive, true)
      ));

    // Create new session
    const [session] = await db
      .insert(readingSessions)
      .values(sessionData)
      .returning();
    return session;
  }

  async updateReadingSession(sessionId: string, updates: Partial<ReadingSession>): Promise<ReadingSession> {
    const [session] = await db
      .update(readingSessions)
      .set(updates)
      .where(eq(readingSessions.id, sessionId))
      .returning();
    return session;
  }

  async endReadingSession(sessionId: string, endPageNumber?: number): Promise<ReadingSession> {
    const updates: Partial<ReadingSession> = {
      isActive: false,
      endTime: new Date(),
    };
    // Note: endPageNumber is not part of ReadingSession schema, 
    // page tracking is handled by readingProgress table

    const [session] = await db
      .update(readingSessions)
      .set(updates)
      .where(eq(readingSessions.id, sessionId))
      .returning();
    return session;
  }

  async getUserReadingSessions(userId: string, limit: number = 10): Promise<ReadingSession[]> {
    return await db
      .select()
      .from(readingSessions)
      .where(eq(readingSessions.userId, userId))
      .orderBy(desc(readingSessions.createdAt))
      .limit(limit);
  }

  async getActiveReadingSession(userId: string, storyId: string): Promise<ReadingSession | undefined> {
    const [session] = await db
      .select()
      .from(readingSessions)
      .where(and(
        eq(readingSessions.userId, userId),
        eq(readingSessions.storyId, storyId),
        eq(readingSessions.isActive, true)
      ))
      .limit(1);
    return session;
  }

  // === READING ANALYTICS ===
  async getReadingStats(userId: string): Promise<{
    totalReadingTimeMinutes: number;
    totalStoriesRead: number;
    totalChoicesMade: number;
    favoriteGenres: string[];
    recentActivity: any[];
  }> {
    // Get total reading time and stats
    const [stats] = await db
      .select({
        totalReadingTime: sql<number>`COALESCE(SUM(${readingProgress.totalReadingTimeMinutes}), 0)`,
        totalStories: sql<number>`COUNT(DISTINCT ${readingProgress.storyId})`,
        totalChoices: sql<number>`COALESCE(SUM(${readingProgress.choicesMade}), 0)`,
      })
      .from(readingProgress)
      .where(eq(readingProgress.userId, userId));

    // Get recent reading activity
    const recentActivity = await db
      .select({
        storyTitle: stories.title,
        lastReadAt: readingProgress.lastReadAt,
        isCompleted: readingProgress.isCompleted,
      })
      .from(readingProgress)
      .leftJoin(stories, eq(readingProgress.storyId, stories.id))
      .where(eq(readingProgress.userId, userId))
      .orderBy(desc(readingProgress.lastReadAt))
      .limit(5);

    // Get favorite genres (most read categories)
    const favoriteGenres = await db
      .select({
        category: stories.category,
        count: sql<number>`COUNT(*)`,
      })
      .from(readingProgress)
      .leftJoin(stories, eq(readingProgress.storyId, stories.id))
      .where(eq(readingProgress.userId, userId))
      .groupBy(stories.category)
      .orderBy(desc(sql`COUNT(*)`))
      .limit(3);

    return {
      totalReadingTimeMinutes: stats?.totalReadingTime || 0,
      totalStoriesRead: stats?.totalStories || 0,
      totalChoicesMade: stats?.totalChoices || 0,
      favoriteGenres: favoriteGenres.map(g => g.category).filter((cat): cat is string => Boolean(cat)),
      recentActivity,
    };
  }

  // === PREMIUM PATH OPERATIONS ===
  async purchasePremiumPath(pathData: {
    userId: string;
    storyId: string;
    choiceId: string;
    eggplantCost: number;
  }): Promise<{ success: boolean }> {
    await db.insert(purchasedPremiumPaths).values(pathData);
    return { success: true };
  }

  async hasPurchasedPremiumPath(userId: string, choiceId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(purchasedPremiumPaths)
      .where(and(
        eq(purchasedPremiumPaths.userId, userId),
        eq(purchasedPremiumPaths.choiceId, choiceId)
      ))
      .limit(1);
    
    return !!result;
  }

  async getUserPurchasedPaths(userId: string, storyId?: string): Promise<any[]> {
    const conditions = [eq(purchasedPremiumPaths.userId, userId)];
    if (storyId) {
      conditions.push(eq(purchasedPremiumPaths.storyId, storyId));
    }

    return await db
      .select({
        id: purchasedPremiumPaths.id,
        userId: purchasedPremiumPaths.userId,
        storyId: purchasedPremiumPaths.storyId,
        choiceId: purchasedPremiumPaths.choiceId,
        eggplantCost: purchasedPremiumPaths.eggplantCost,
        createdAt: purchasedPremiumPaths.createdAt,
        // Include choice and story details
        choiceText: storyChoices.choiceText,
        storyTitle: stories.title,
      })
      .from(purchasedPremiumPaths)
      .leftJoin(storyChoices, eq(purchasedPremiumPaths.choiceId, storyChoices.id))
      .leftJoin(stories, eq(purchasedPremiumPaths.storyId, stories.id))
      .where(and(...conditions))
      .orderBy(desc(purchasedPremiumPaths.createdAt));
  }

  // === START FROM BEGINNING HELPERS ===
  async deleteReadingProgress(userId: string, storyId: string): Promise<void> {
    await db.delete(readingProgress).where(and(
      eq(readingProgress.userId, userId),
      eq(readingProgress.storyId, storyId)
    ));
  }

  async clearUserChoiceHistory(userId: string, storyId: string): Promise<void> {
    await db.delete(userChoices).where(and(
      eq(userChoices.userId, userId),
      eq(userChoices.storyId, storyId)
    ));
  }

  // === STORY MAP GENERATION ===
  async getStoryMapData(storyId: string, ownedChoiceIds: Set<string>) {
    // Get all pages and choices for the story
    const pages = await db
      .select()
      .from(storyPages)
      .where(eq(storyPages.storyId, storyId))
      .orderBy(storyPages.order);
      
    console.log(`Found ${pages.length} pages for story ${storyId}`);

    const allChoices = await db
      .select({
        id: storyChoices.id,
        fromPageId: storyChoices.fromPageId,
        toPageId: storyChoices.toPageId,
        choiceText: storyChoices.choiceText,
        isPremium: storyChoices.isPremium,
        eggplantCost: storyChoices.eggplantCost,
        targetPage: storyChoices.targetPage,
        order: storyChoices.order,
      })
      .from(storyChoices)
      .innerJoin(storyPages, eq(storyChoices.fromPageId, storyPages.id))
      .where(eq(storyPages.storyId, storyId))
      .orderBy(storyPages.order, storyChoices.order);

    // Build accessible choice tree (only real branching choices, not navigation)
    const accessibleChoices = allChoices.filter(choice => {
      // Skip simple navigation choices
      if (choice.choiceText === "Continue" || choice.choiceText === "Next") {
        return false;
      }
      // Only include free choices or owned premium choices
      return !choice.isPremium || ownedChoiceIds.has(choice.id);
    });



    // Create map page bubbles with positioning
    const mapBubbles: Array<{
      id: string;
      type: 'page' | 'choice' | 'ending';
      pageNumber: number;
      title: string;
      isPremium: boolean;
      isOwned: boolean;
      x: number;
      y: number;
      connections: string[];
    }> = [];

    // Use ALL pages to show complete story structure, not just accessible ones
    const accessiblePages = pages;
    
    // Create a hierarchical layout
    const layoutBubbles = this.calculateStoryLayout(accessiblePages, accessibleChoices);
    
    layoutBubbles.forEach(layoutBubble => {
      const page = layoutBubble.page;
      const pageChoices = accessibleChoices.filter(c => c.fromPageId === page.id);
      const isChoicePage = pageChoices.length > 0;
      const isEndingPage = pageChoices.length === 0 && page.order > 1;

      // Generate two-word name based on content
      let displayName = this.generateTwoWordName(page.title || '', page.content || '', isChoicePage, isEndingPage);

      // Determine if this is a premium path
      let hasPremiumPath = false;
      let isOwned = true;
      pageChoices.forEach(choice => {
        if (choice.isPremium) {
          hasPremiumPath = true;
          if (!ownedChoiceIds.has(choice.id)) {
            isOwned = false;
          }
        }
      });

      mapBubbles.push({
        id: page.id,
        type: isEndingPage ? 'ending' : isChoicePage ? 'choice' : 'page',
        pageNumber: page.order,
        title: displayName,
        isPremium: hasPremiumPath,
        isOwned: isOwned,
        x: layoutBubble.x,
        y: layoutBubble.y,
        connections: pageChoices.map(c => c.id),
      });
    });

    return {
      storyId,
      pageBubbles: mapBubbles,
      choices: accessibleChoices.map(choice => ({
        id: choice.id,
        fromPageId: choice.fromPageId,
        toPageId: choice.toPageId,
        text: choice.choiceText,
        isPremium: choice.isPremium,
        isOwned: ownedChoiceIds.has(choice.id),
        eggplantCost: choice.eggplantCost || 0,
        targetPage: choice.targetPage,
      })),
    };
  }

  // Calculate branching layout using page order numbers instead of IDs
  private calculateStoryLayout(pages: any[], choices: any[]) {
    const layoutBubbles: Array<{ page: any; x: number; y: number }> = [];
    
    // Sort pages by order
    const sortedPages = [...pages].sort((a, b) => a.order - b.order);
    
    // Create a map of page order -> page connections using targetPage numbers
    const pageConnections = new Map<number, number[]>();
    
    choices.forEach(choice => {
      if (choice.targetPage) {
        const fromPage = pages.find(p => p.id === choice.fromPageId);
        if (fromPage) {
          if (!pageConnections.has(fromPage.order)) {
            pageConnections.set(fromPage.order, []);
          }
          pageConnections.get(fromPage.order)!.push(choice.targetPage);
        }
      }
    });
    
    // Build tree structure using breadth-first search with page orders
    const positioned = new Set<number>();
    const queue: Array<{ pageOrder: number; x: number; y: number; level: number }> = [];
    
    // Position starting page at center top
    queue.push({ pageOrder: 1, x: 0, y: 0, level: 0 });
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      
      if (positioned.has(current.pageOrder)) continue;
      positioned.add(current.pageOrder);
      
      const page = sortedPages.find(p => p.order === current.pageOrder);
      if (page) {
        layoutBubbles.push({ page, x: current.x, y: current.y });
        
        // Get children using targetPage numbers
        const childOrderNumbers = pageConnections.get(current.pageOrder) || [];
        const childPages = childOrderNumbers.map(order => sortedPages.find(p => p.order === order)).filter(Boolean);
        
        if (childPages.length > 0) {
          // Spread children horizontally based on number of branches
          const startX = current.x - (childPages.length - 1) * 0.75;
          childPages.forEach((childPage, index) => {
            if (!positioned.has(childPage.order)) {
              queue.push({
                pageOrder: childPage.order,
                x: startX + index * 1.5, // Spread branches horizontally
                y: current.y + 1.5, // Move down vertically
                level: current.level + 1
              });
            }
          });
        } else if (current.pageOrder < sortedPages.length) {
          // For linear progression without choices, add the next page in order
          const nextPage = sortedPages.find(p => p.order === current.pageOrder + 1);
          if (nextPage && !positioned.has(nextPage.order)) {
            queue.push({
              pageOrder: nextPage.order,
              x: current.x, // Keep same x position for linear flow
              y: current.y + 1.5, // Move down vertically
              level: current.level + 1
            });
          }
        }
      }
    }
    
    // Add any remaining unpositioned pages (orphaned pages)
    sortedPages.forEach((page, index) => {
      if (!positioned.has(page.order)) {
        layoutBubbles.push({ 
          page, 
          x: 3 + (index % 3), // Position orphaned pages to the right
          y: Math.floor(index / 3) * 1.5,
        });
      }
    });
    
    return layoutBubbles;
  }

  // Generate two-word names based on content like in the sketch
  private generateTwoWordName(title: string, content: string, isChoicePage: boolean, isEndingPage: boolean): string {
    // If it's an ending, use ending-specific words
    if (isEndingPage) {
      const endingWords = ['Back', 'Home', 'Away', 'Total', 'Submission', 'Dominated', 'Escape'];
      const endings = ['Home', 'Away', 'Submission', 'Dominated', 'Escape', 'Complete'];
      return `${endingWords[Math.floor(Math.random() * endingWords.length)]} ${endings[Math.floor(Math.random() * endings.length)]}`;
    }

    // For choice pages, extract meaningful words
    const allText = `${title} ${content}`.toLowerCase();
    
    // Common two-word patterns from your sketch
    const choicePatterns = [
      'Look Hard', 'Sneak Around', 'Quick Peek', 'Subtle Flirting', 
      'Making Work', 'The Choice', 'Back Wife', 'Away Go',
      'Total Submission', 'Process Flow', 'Decision Point'
    ];

    // Try to match content to patterns
    if (allText.includes('peek') || allText.includes('look')) return 'Quick Peek';
    if (allText.includes('sneak') || allText.includes('around')) return 'Sneak Around';
    if (allText.includes('hard') || allText.includes('difficult')) return 'Look Hard';
    if (allText.includes('flirt') || allText.includes('subtle')) return 'Subtle Flirting';
    if (allText.includes('work') || allText.includes('job')) return 'Making Work';
    if (allText.includes('choice') || allText.includes('decide')) return 'The Choice';
    if (allText.includes('wife') || allText.includes('home')) return 'Back Wife';
    if (allText.includes('submit') || allText.includes('surrender')) return 'Total Submission';
    if (allText.includes('dominate') || allText.includes('control')) return 'Dominated';
    
    // Default choice page name
    return isChoicePage ? 'The Choice' : 'Process Flow';
  }

  async getStoryStartingPage(storyId: string): Promise<StoryPage | undefined> {
    const [node] = await db
      .select()
      .from(storyPages)
      .where(and(
        eq(storyPages.storyId, storyId),
        eq(storyPages.isStarting, true)
      ))
      .limit(1);
    return node;
  }

  // Analytics event logging
  async logAnalyticsEvent(eventType: string, data: any): Promise<void> {
    // For now, log to console - could extend to dedicated analytics table
    console.log(`[ANALYTICS] ${eventType}:`, JSON.stringify(data, null, 2));
  }

  // Get premium choice analytics
  async getPremiumChoiceAnalytics(storyId: string, choiceId?: string): Promise<any[]> {
    // This would query an analytics table in production
    // For now, return empty array - extend when implementing analytics storage
    return [];
  }

  // === ENDING CARDS SYSTEM ===
  
  // Create an ending card for a story
  async createEndingCard(cardData: {
    storyId: string;
    pageId: string;
    cardTitle: string;
    cardSubtitle?: string;
    cardDescription: string;
    cardImageUrl?: string;
    rarity?: "ember" | "flame" | "inferno";
    emotionTag?: string;
    unlockCondition?: string;
    isSecret?: boolean;
    sortOrder?: number;
  }): Promise<any> {
    const [card] = await db.insert(endingCards).values(cardData).returning();
    return card;
  }

  // Get all ending cards for a story
  async getStoryEndingCards(storyId: string): Promise<any[]> {
    return await db
      .select()
      .from(endingCards)
      .where(eq(endingCards.storyId, storyId))
      .orderBy(asc(endingCards.sortOrder), asc(endingCards.cardTitle));
  }

  // Check if user has collected a specific ending card
  async hasCollectedCard(userId: string, cardId: string): Promise<boolean> {
    const [result] = await db
      .select()
      .from(userEndingCards)
      .where(and(
        eq(userEndingCards.userId, userId),
        eq(userEndingCards.cardId, cardId)
      ))
      .limit(1);
    
    return !!result;
  }

  // Award random ending card to user (when they reach an ending)
  async awardRandomEndingCard(userId: string, pageId: string): Promise<any> {
    try {
      // Get all possible cards for this ending page
      const availableCards = await db
        .select()
        .from(endingCards)
        .where(eq(endingCards.pageId, pageId));
      
      if (availableCards.length === 0) {
        return { success: false, reason: 'no_cards_available' };
      }

      // Get user's existing cards for this page to avoid duplicates within the same session
      const existingCards = await db
        .select({ cardId: userEndingCards.cardId })
        .from(userEndingCards)
        .innerJoin(endingCards, eq(userEndingCards.cardId, endingCards.id))
        .where(and(
          eq(userEndingCards.userId, userId),
          eq(endingCards.pageId, pageId)
        ));
      
      const ownedCardIds = existingCards.map(c => c.cardId);
      const unownedCards = availableCards.filter(card => !ownedCardIds.includes(card.id));
      
      // If user has all cards, give them a random one anyway (for sharing)
      const cardsToChooseFrom = unownedCards.length > 0 ? unownedCards : availableCards;
      
      // Weighted random selection based on rarity (simplified three-tier system)
      const rarityWeights = {
        ember: 60,    // Common
        flame: 30,    // Uncommon  
        inferno: 10   // Rare
      };
      
      const weightedCards: any[] = [];
      cardsToChooseFrom.forEach(card => {
        const weight = rarityWeights[card.rarity as keyof typeof rarityWeights] || 50;
        for (let i = 0; i < weight; i++) {
          weightedCards.push(card);
        }
      });
      
      const selectedCard = weightedCards[Math.floor(Math.random() * weightedCards.length)];
      
      // Award the card (even if duplicate for sharing purposes)
      const [userCard] = await db
        .insert(userEndingCards)
        .values({
          userId,
          cardId: selectedCard.id,
          isNewCard: true
        })
        .returning();

      return { 
        success: true, 
        userCard,
        card: selectedCard,
        isDuplicate: ownedCardIds.includes(selectedCard.id)
      };
    } catch (error) {
      console.error('Error awarding random ending card:', error);
      return { success: false, reason: 'database_error' };
    }
  }

  // Award specific ending card to user (legacy method)
  async awardEndingCard(userId: string, cardId: string): Promise<any> {
    try {
      // Check if already collected
      const alreadyHas = await this.hasCollectedCard(userId, cardId);
      if (alreadyHas) {
        return { success: false, reason: 'already_collected' };
      }

      const [userCard] = await db
        .insert(userEndingCards)
        .values({
          userId,
          cardId,
          isNewCard: true
        })
        .returning();

      return { success: true, userCard };
    } catch (error) {
      return { success: false, reason: 'database_error' };
    }
  }

  // Get user's collected ending cards
  async getUserEndingCards(userId: string, storyId?: string): Promise<any[]> {
    let query = db
      .select({
        id: userEndingCards.id,
        cardId: userEndingCards.cardId,
        unlockedAt: userEndingCards.unlockedAt,
        isNewCard: userEndingCards.isNewCard,
        cardTitle: endingCards.cardTitle,
        cardSubtitle: endingCards.cardSubtitle,
        cardDescription: endingCards.cardDescription,
        cardImageUrl: endingCards.cardImageUrl,
        rarity: endingCards.rarity,
        emotionTag: endingCards.emotionTag,
        unlockCondition: endingCards.unlockCondition,
        storyId: endingCards.storyId,
        storyTitle: stories.title
      })
      .from(userEndingCards)
      .innerJoin(endingCards, eq(userEndingCards.cardId, endingCards.id))
      .innerJoin(stories, eq(endingCards.storyId, stories.id))
      .where(eq(userEndingCards.userId, userId));

    if (storyId) {
      query = query.where(eq(endingCards.storyId, storyId)) as any;
    }

    return await query.orderBy(desc(userEndingCards.unlockedAt));
  }

  // Mark cards as viewed (remove "NEW!" badge)
  async markCardsAsViewed(userId: string, cardIds: string[]): Promise<void> {
    if (cardIds.length === 0) return;
    
    await db
      .update(userEndingCards)
      .set({ isNewCard: false })
      .where(and(
        eq(userEndingCards.userId, userId),
        inArray(userEndingCards.cardId, cardIds)
      ));
  }

  // Get ending card for a specific story page (for auto-awarding)
  async getEndingCardForPage(pageId: string): Promise<any> {
    const [card] = await db
      .select()
      .from(endingCards)
      .where(eq(endingCards.pageId, pageId))
      .limit(1);
    
    return card;
  }

  // Get user's collection stats
  async getUserCollectionStats(userId: string): Promise<{
    totalCards: number;
    cardsByRarity: Record<string, number>;
    completedStories: number;
    newCardsCount: number;
  }> {
    const userCards = await this.getUserEndingCards(userId);
    
    const stats = {
      totalCards: userCards.length,
      cardsByRarity: {
        ember: 0,
        flame: 0,
        inferno: 0
      },
      completedStories: new Set(userCards.map(card => card.storyId)).size,
      newCardsCount: userCards.filter(card => card.isNewCard).length
    };

    userCards.forEach(card => {
      if (card.rarity && (card.rarity === 'ember' || card.rarity === 'flame' || card.rarity === 'inferno')) {
        stats.cardsByRarity[card.rarity as keyof typeof stats.cardsByRarity]++;
      }
    });

    return stats;
  }
}

export const storage = new Storage();