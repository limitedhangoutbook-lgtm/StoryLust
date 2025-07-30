import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  users,
  stories,
  storyNodes,
  storyChoices,
  readingProgress,
  userChoices,
  personalBookmarks,
  readingSessions,
  purchasedPremiumPaths,
  type User,
  type UpsertUser,
  type Story,
  type StoryNode,
  type StoryChoice,
  type ReadingProgress,
  type InsertReadingProgress,
  type InsertUserChoice,
  type PersonalBookmark,
  type InsertPersonalBookmark,
  type ReadingSession,
  type InsertReadingSession,

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

  async getStoryPages(storyId: string): Promise<StoryNode[]> {
    return await db
      .select()
      .from(storyNodes)
      .where(eq(storyNodes.storyId, storyId))
      .orderBy(storyNodes.order);
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

  async createStoryNode(nodeData: {
    storyId: string;
    title: string;
    content: string;
    order: number;
    isStarting?: boolean;
  }): Promise<StoryNode> {
    const [node] = await db
      .insert(storyNodes)
      .values({
        ...nodeData,
        isStarting: nodeData.isStarting || false,
      })
      .returning();
    return node;
  }

  async updateStoryNode(nodeId: string, updates: Partial<StoryNode>): Promise<StoryNode> {
    const [node] = await db
      .update(storyNodes)
      .set(updates)
      .where(eq(storyNodes.id, nodeId))
      .returning();
    return node;
  }

  async deleteStoryNode(nodeId: string): Promise<void> {
    await db.delete(storyNodes).where(eq(storyNodes.id, nodeId));
  }

  async createStoryChoice(choiceData: {
    fromNodeId: string;
    toNodeId: string;
    choiceText: string;
    order?: number;
    isPremium?: boolean;
    eggplantCost?: number;
  }): Promise<StoryChoice> {
    const [choice] = await db
      .insert(storyChoices)
      .values({
        fromNodeId: choiceData.fromNodeId,
        toNodeId: choiceData.toNodeId,
        choiceText: choiceData.choiceText,
        order: choiceData.order || 0,
        isPremium: choiceData.isPremium || false,
        eggplantCost: choiceData.eggplantCost || 0,
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

  // === STORY NODE OPERATIONS ===
  async getStoryNode(nodeId: string): Promise<StoryNode | undefined> {
    const [node] = await db.select().from(storyNodes).where(eq(storyNodes.id, nodeId));
    return node;
  }

  async getStoryNodes(storyId: string): Promise<StoryNode[]> {
    return await db
      .select()
      .from(storyNodes)
      .where(eq(storyNodes.storyId, storyId))
      .orderBy(storyNodes.order);
  }

  async getFirstStoryNode(storyId: string): Promise<StoryNode | undefined> {
    const [node] = await db
      .select()
      .from(storyNodes)
      .where(eq(storyNodes.storyId, storyId))
      .orderBy(storyNodes.order)
      .limit(1);
    return node;
  }

  // === STORY CHOICE OPERATIONS ===
  async getChoicesFromNode(fromNodeId: string): Promise<StoryChoice[]> {
    return await db
      .select()
      .from(storyChoices)
      .where(eq(storyChoices.fromNodeId, fromNodeId))
      .orderBy(storyChoices.order);
  }

  async getChoice(choiceId: string): Promise<StoryChoice | undefined> {
    const [choice] = await db.select().from(storyChoices).where(eq(storyChoices.id, choiceId));
    return choice;
  }

  async getStoryChoice(choiceId: string): Promise<StoryChoice | undefined> {
    const [choice] = await db.select().from(storyChoices).where(eq(storyChoices.id, choiceId));
    return choice;
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
          currentNodeId: progressData.currentNodeId,
          isBookmarked: progressData.isBookmarked,
          isCompleted: progressData.isCompleted,
          completedAt: progressData.completedAt,
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
        currentNodeId: "", // Will be overridden by conflict update
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
    diamondsSpent: number;
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

    // Get user for diamonds spent (would need transaction history for real calculation)
    const user = await this.getUser(userId);
    
    return {
      storiesStarted: startedResult?.count || 0,
      storiesCompleted: completedResult?.count || 0,
      totalChoicesMade: choicesResult?.count || 0,
      bookmarkedStories: bookmarkedResult?.count || 0,
      premiumChoicesUnlocked: premiumResult?.count || 0,
      diamondsSpent: 0, // Would need transaction history
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
        nodeId: personalBookmarks.nodeId,
        title: personalBookmarks.title,
        notes: personalBookmarks.notes,
        isPrivate: personalBookmarks.isPrivate,
        createdAt: personalBookmarks.createdAt,
        updatedAt: personalBookmarks.updatedAt,
        // Include story and node details
        storyTitle: stories.title,
        nodeTitle: storyNodes.title,
      })
      .from(personalBookmarks)
      .leftJoin(stories, eq(personalBookmarks.storyId, stories.id))
      .leftJoin(storyNodes, eq(personalBookmarks.nodeId, storyNodes.id))
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

  async endReadingSession(sessionId: string, endNodeId?: string): Promise<ReadingSession> {
    const updates: Partial<ReadingSession> = {
      isActive: false,
      endTime: new Date(),
    };
    if (endNodeId) {
      updates.endNodeId = endNodeId;
    }

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
        diamondCost: purchasedPremiumPaths.diamondCost,
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

  async getStoryStartingNode(storyId: string): Promise<StoryNode | undefined> {
    const [node] = await db
      .select()
      .from(storyNodes)
      .where(and(
        eq(storyNodes.storyId, storyId),
        eq(storyNodes.isStarting, true)
      ))
      .limit(1);
    return node;
  }
}

export const storage = new Storage();