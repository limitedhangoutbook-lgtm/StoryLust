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

export class Storage {
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
          lastReadAt: new Date(),
        },
      })
      .returning();
    return progress;
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