import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";
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

export class SimpleStorage {
  // === USER OPERATIONS ===
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: { ...userData, updatedAt: new Date() },
      })
      .returning();
    return user;
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

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  // === STORY OPERATIONS ===
  async getAllStories(): Promise<Story[]> {
    return await db.select().from(stories);
  }

  async getFeaturedStory(): Promise<Story | undefined> {
    const [story] = await db
      .select()
      .from(stories)
      .where(eq(stories.isFeatured, true))
      .limit(1);
    return story;
  }

  async getStory(id: string): Promise<Story | undefined> {
    const [story] = await db.select().from(stories).where(eq(stories.id, id));
    return story;
  }

  // === STORY NODE OPERATIONS ===
  async getStoryNode(id: string): Promise<StoryNode | undefined> {
    const [node] = await db.select().from(storyNodes).where(eq(storyNodes.id, id));
    return node;
  }

  async getStartingNode(storyId: string): Promise<StoryNode | undefined> {
    const [node] = await db
      .select()
      .from(storyNodes)
      .where(and(eq(storyNodes.storyId, storyId), eq(storyNodes.isStarting, true)))
      .limit(1);
    return node;
  }

  // === STORY CHOICE OPERATIONS ===
  async getChoicesFromNode(nodeId: string): Promise<StoryChoice[]> {
    return await db
      .select()
      .from(storyChoices)
      .where(eq(storyChoices.fromNodeId, nodeId))
      .orderBy(storyChoices.order);
  }

  async getStoryChoice(id: string): Promise<StoryChoice | undefined> {
    const [choice] = await db.select().from(storyChoices).where(eq(storyChoices.id, id));
    return choice;
  }

  // === READING PROGRESS OPERATIONS ===
  async getStoryProgress(userId: string, storyId: string): Promise<ReadingProgress | undefined> {
    const [progress] = await db
      .select()
      .from(readingProgress)
      .where(and(eq(readingProgress.userId, userId), eq(readingProgress.storyId, storyId)));
    return progress;
  }

  async getUserReadingProgress(userId: string): Promise<ReadingProgress[]> {
    return await db
      .select()
      .from(readingProgress)
      .where(eq(readingProgress.userId, userId))
      .orderBy(desc(readingProgress.lastReadAt));
  }

  async upsertReadingProgress(progressData: InsertReadingProgress): Promise<ReadingProgress> {
    const [progress] = await db
      .insert(readingProgress)
      .values(progressData)
      .onConflictDoUpdate({
        target: [readingProgress.userId, readingProgress.storyId],
        set: { 
          currentNodeId: progressData.currentNodeId,
          lastReadAt: new Date()
        },
      })
      .returning();
    return progress;
  }

  async toggleBookmark(userId: string, storyId: string): Promise<ReadingProgress> {
    const existing = await this.getStoryProgress(userId, storyId);
    const [progress] = await db
      .insert(readingProgress)
      .values({
        userId,
        storyId,
        currentNodeId: existing?.currentNodeId || "",
        isBookmarked: !(existing?.isBookmarked || false),
      })
      .onConflictDoUpdate({
        target: [readingProgress.userId, readingProgress.storyId],
        set: { 
          isBookmarked: !(existing?.isBookmarked || false),
          lastReadAt: new Date()
        },
      })
      .returning();
    return progress;
  }

  // === USER CHOICE OPERATIONS ===
  async saveUserChoice(choiceData: InsertUserChoice): Promise<void> {
    await db.insert(userChoices).values(choiceData);
  }

  async getUserChoicesForStory(userId: string, storyId: string): Promise<StoryChoice[]> {
    const choices = await db
      .select({ 
        choice: storyChoices
      })
      .from(userChoices)
      .innerJoin(storyChoices, eq(userChoices.choiceId, storyChoices.id))
      .where(and(eq(userChoices.userId, userId), eq(userChoices.storyId, storyId)));
    
    return choices.map(c => c.choice);
  }
}

export const storage = new SimpleStorage();