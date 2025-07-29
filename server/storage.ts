import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  users,
  stories,
  storyNodes,
  storyChoices,
  readingProgress,
  userChoices,
  type User,
  type UpsertUser,
  type Story,
  type StoryNode,
  type StoryChoice,
  type ReadingProgress,
  type InsertReadingProgress,
  type InsertUserChoice,
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
        arrows: userData.arrows ?? (userData.role === 'mega-admin' ? 999 : 20), // Give mega-admin 999 arrows
      })
      .onConflictDoUpdate({
        target: users.id,
        set: { 
          ...userData, 
          updatedAt: new Date(),
          // Don't overwrite arrows on existing users unless explicitly provided
          arrows: userData.arrows !== undefined ? userData.arrows : sql`${users.arrows}`,
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async updateUserArrows(userId: string, arrows: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ arrows, updatedAt: new Date() })
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
    arrowCost?: number;
  }): Promise<StoryChoice> {
    const [choice] = await db
      .insert(storyChoices)
      .values({
        fromNodeId: choiceData.fromNodeId,
        toNodeId: choiceData.toNodeId,
        choiceText: choiceData.choiceText,
        order: choiceData.order || 0,
        isPremium: choiceData.isPremium || false,
        arrowCost: choiceData.arrowCost || 0,
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
    arrowsSpent: number;
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

    // Get user for arrows spent (would need transaction history for real calculation)
    const user = await this.getUser(userId);
    
    return {
      storiesStarted: startedResult?.count || 0,
      storiesCompleted: completedResult?.count || 0,
      totalChoicesMade: choicesResult?.count || 0,
      bookmarkedStories: bookmarkedResult?.count || 0,
      premiumChoicesUnlocked: premiumResult?.count || 0,
      arrowsSpent: 0, // Would need transaction history
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
}

export const storage = new Storage();