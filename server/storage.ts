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
  type InsertStory,
  type InsertStoryNode,
  type InsertStoryChoice,
  type InsertReadingProgress,
  type InsertUserChoice,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserDiamonds(userId: string, diamonds: number): Promise<User>;
  updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User>;

  // Story operations
  getAllStories(category?: string): Promise<Story[]>;
  getFeaturedStory(): Promise<Story | undefined>;
  getStory(id: string): Promise<Story | undefined>;
  createStory(story: InsertStory): Promise<Story>;

  // Story node operations
  getStoryNodes(storyId: string): Promise<StoryNode[]>;
  getStoryNode(id: string): Promise<StoryNode | undefined>;
  getStartingNode(storyId: string): Promise<StoryNode | undefined>;
  createStoryNode(node: InsertStoryNode): Promise<StoryNode>;

  // Story choice operations
  getChoicesFromNode(nodeId: string): Promise<StoryChoice[]>;
  getStoryChoice(id: string): Promise<StoryChoice | undefined>;
  createStoryChoice(choice: InsertStoryChoice): Promise<StoryChoice>;

  // Reading progress operations
  getUserReadingProgress(userId: string): Promise<ReadingProgress[]>;
  getStoryProgress(userId: string, storyId: string): Promise<ReadingProgress | undefined>;
  upsertReadingProgress(progress: InsertReadingProgress): Promise<ReadingProgress>;
  toggleBookmark(userId: string, storyId: string): Promise<ReadingProgress>;

  // User choice operations
  saveUserChoice(choice: InsertUserChoice): Promise<void>;
  getUserChoicesForStory(userId: string, storyId: string): Promise<StoryChoice[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
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
        set: {
          ...userData,
          updatedAt: new Date(),
        },
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

  async updateUserStripeInfo(userId: string, stripeCustomerId: string, stripeSubscriptionId?: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ 
        stripeCustomerId, 
        stripeSubscriptionId,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Story operations
  async getAllStories(category?: string): Promise<Story[]> {
    if (category && category !== 'all') {
      return await db
        .select()
        .from(stories)
        .where(and(eq(stories.isPublished, true), eq(stories.category, category)))
        .orderBy(desc(stories.createdAt));
    }

    return await db
      .select()
      .from(stories)
      .where(eq(stories.isPublished, true))
      .orderBy(desc(stories.createdAt));
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

  async createStory(storyData: InsertStory): Promise<Story> {
    const [story] = await db.insert(stories).values(storyData).returning();
    return story;
  }

  // Story node operations
  async getStoryNodes(storyId: string): Promise<StoryNode[]> {
    return await db
      .select()
      .from(storyNodes)
      .where(eq(storyNodes.storyId, storyId))
      .orderBy(storyNodes.order);
  }

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

  async createStoryNode(nodeData: InsertStoryNode): Promise<StoryNode> {
    const [node] = await db.insert(storyNodes).values(nodeData).returning();
    return node;
  }

  // Story choice operations
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

  async createStoryChoice(choiceData: InsertStoryChoice): Promise<StoryChoice> {
    const [choice] = await db.insert(storyChoices).values(choiceData).returning();
    return choice;
  }

  // Reading progress operations
  async getUserReadingProgress(userId: string): Promise<ReadingProgress[]> {
    return await db
      .select()
      .from(readingProgress)
      .where(eq(readingProgress.userId, userId))
      .orderBy(desc(readingProgress.lastReadAt));
  }

  async getStoryProgress(userId: string, storyId: string): Promise<ReadingProgress | undefined> {
    const [progress] = await db
      .select()
      .from(readingProgress)
      .where(and(eq(readingProgress.userId, userId), eq(readingProgress.storyId, storyId)));
    return progress;
  }

  async upsertReadingProgress(progressData: InsertReadingProgress): Promise<ReadingProgress> {
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

  async toggleBookmark(userId: string, storyId: string): Promise<ReadingProgress> {
    const existing = await this.getStoryProgress(userId, storyId);
    
    if (existing) {
      const [progress] = await db
        .update(readingProgress)
        .set({ isBookmarked: !existing.isBookmarked })
        .where(and(eq(readingProgress.userId, userId), eq(readingProgress.storyId, storyId)))
        .returning();
      return progress;
    } else {
      // Need to get starting node for new bookmark
      const startingNode = await this.getStartingNode(storyId);
      if (!startingNode) {
        throw new Error('Story has no starting node');
      }
      
      const [progress] = await db
        .insert(readingProgress)
        .values({
          userId,
          storyId,
          currentNodeId: startingNode.id,
          isBookmarked: true,
        })
        .returning();
      return progress;
    }
  }

  // User choice operations
  async saveUserChoice(choiceData: InsertUserChoice): Promise<void> {
    await db.insert(userChoices).values(choiceData);
  }

  async getUserChoicesForStory(userId: string, storyId: string): Promise<StoryChoice[]> {
    const result = await db
      .select({
        id: storyChoices.id,
        fromNodeId: storyChoices.fromNodeId,
        toNodeId: storyChoices.toNodeId,
        choiceText: storyChoices.choiceText,
        isPremium: storyChoices.isPremium,
        diamondCost: storyChoices.diamondCost,
        order: storyChoices.order,
        createdAt: storyChoices.createdAt,
      })
      .from(userChoices)
      .innerJoin(storyChoices, eq(userChoices.choiceId, storyChoices.id))
      .where(and(eq(userChoices.userId, userId), eq(userChoices.storyId, storyId)));

    return result;
  }
}

export const storage = new DatabaseStorage();
