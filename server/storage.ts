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
        diamonds: userData.diamonds ?? (userData.role === 'mega-admin' ? 999 : 20), // Give mega-admin 999 diamonds
      })
      .onConflictDoUpdate({
        target: users.id,
        set: { 
          ...userData, 
          updatedAt: new Date(),
          // Don't overwrite diamonds on existing users unless explicitly provided
          diamonds: userData.diamonds !== undefined ? userData.diamonds : sql`${users.diamonds}`,
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(users.createdAt);
  }

  async updateUserDiamonds(userId: string, diamonds: number): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ diamonds, updatedAt: new Date() })
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
}

export const storage = new Storage();