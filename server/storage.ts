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

// Sample story data for testing
const sampleStories = [
  {
    id: "campus-encounter",
    title: "Campus Encounter",
    description: "Jake thought college would be just about classes and parties, until he met Alex in the library one rainy evening.",
    imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=450&fit=crop",
    spiceLevel: 2,
    category: "straight",
    wordCount: 8500,
    pathCount: 6,
    isFeatured: true,
    isPublished: true
  },
  {
    id: "midnight-coffee",
    title: "Midnight Coffee",
    description: "Working late at the coffee shop, Sam never expected the regular customer to change everything.",
    imageUrl: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=450&fit=crop",
    spiceLevel: 1,
    category: "lgbt",
    wordCount: 7200,
    pathCount: 4,
    isFeatured: false,
    isPublished: true
  },
  {
    id: "city-nights",
    title: "City Nights",
    description: "The neon lights of downtown hide secrets and desires in every shadow.",
    imageUrl: "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=800&h=450&fit=crop",
    spiceLevel: 3,
    category: "straight",
    wordCount: 9800,
    pathCount: 8,
    isFeatured: false,
    isPublished: true
  }
];

const sampleNodes = {
  "campus-encounter": [
    {
      id: "start",
      storyId: "campus-encounter",
      title: "The Library",
      content: `The rain drummed against the library windows as Jake hunched over his economics textbook. It was nearly midnight, and the building was almost empty except for the soft footsteps of someone approaching his table.

"Mind if I sit here?" The voice was warm, confident. Jake looked up to see Alex—someone he'd noticed in his philosophy class but never had the courage to talk to.

The library felt suddenly smaller, the air charged with possibility.`,
      isStartNode: true,
      isPremium: false,
      choices: [
        {
          id: "choice-1a",
          text: "Smile and gesture to the empty chair",
          nextNodeId: "friendly-start"
        },
        {
          id: "choice-1b", 
          text: "Look back down at your book nervously",
          nextNodeId: "shy-start"
        }
      ]
    },
    {
      id: "friendly-start",
      storyId: "campus-encounter",
      title: "Breaking the Ice",
      content: `"Of course," Jake said, closing his textbook with perhaps a bit too much enthusiasm. Alex smiled—a real smile that reached their eyes—and settled into the chair across from him.

"Economics, huh? That's either really boring or really fascinating, depending on the professor." Alex pulled out a worn copy of Camus, fingers brushing Jake's arm as they arranged their things.

The touch was brief but electric.`,
      isPremium: false,
      choices: [
        {
          id: "choice-2a",
          text: "Ask about their philosophy class",
          nextNodeId: "philosophy-talk"
        },
        {
          id: "choice-2b",
          text: "Offer to help with their reading",
          nextNodeId: "study-together"
        },
        {
          id: "choice-2c",
          text: "Suggest getting coffee instead",
          nextNodeId: "coffee-break",
          isPremium: true,
          cost: 50
        }
      ]
    },
    {
      id: "shy-start", 
      storyId: "campus-encounter",
      title: "Second Chances",
      content: `Jake's cheeks burned as he pretended to read the same paragraph for the third time. He could feel Alex's presence, could smell their subtle cologne mixed with coffee and rain.

After a few minutes of charged silence, Alex cleared their throat softly. "I'm Alex, by the way. From Professor Chen's philosophy class?"

Jake finally looked up, meeting eyes that seemed to understand his nervousness.`,
      isPremium: false,
      choices: [
        {
          id: "choice-3a",
          text: "Introduce yourself properly",
          nextNodeId: "second-chance"
        },
        {
          id: "choice-3b",
          text: "Ask if they need help studying",
          nextNodeId: "study-together" 
        }
      ]
    },
    {
      id: "coffee-break",
      storyId: "campus-encounter", 
      title: "After Hours",
      content: `The campus coffee shop was closed, but Alex knew a 24-hour diner off campus. As they walked through the rain, sharing Jake's umbrella, their shoulders touched with each step.

"I've been wanting to talk to you all semester," Alex admitted, their breath visible in the cool night air. "You always look so focused in class, like you're seeing something the rest of us miss."

The diner's neon sign reflected in puddles as they approached, but Jake was only aware of the warmth radiating from Alex beside him.`,
      isPremium: true,
      choices: [
        {
          id: "choice-4a",
          text: "Admit you've noticed them too",
          nextNodeId: "mutual-attraction"
        },
        {
          id: "choice-4b",
          text: "Ask what they've been thinking about you",
          nextNodeId: "deeper-conversation"
        }
      ]
    },
    {
      id: "philosophy-talk",
      storyId: "campus-encounter",
      title: "Deep Thoughts",
      content: `"I love that class," Jake said, genuinely interested. "Professor Chen has this way of making ancient philosophy feel relevant to our lives now."

Alex's eyes lit up. "Exactly! Like this week's reading about authentic existence. It made me think about all the masks we wear, you know? Like right now, I'm being more honest with you than I've been with anyone in months."

The admission hung in the air between them, raw and vulnerable.`,
      isPremium: false,
      choices: [
        {
          id: "choice-5a",
          text: "Ask what mask they usually wear",
          nextNodeId: "vulnerable-moment"
        },
        {
          id: "choice-5b",
          text: "Share something honest about yourself",
          nextNodeId: "mutual-vulnerability"
        }
      ]
    },
    {
      id: "study-together",
      storyId: "campus-encounter",
      title: "Study Buddies",
      content: `"I could help you with that," Jake offered, gesturing to Alex's philosophy book. "I find discussing the concepts out loud helps me understand them better."

They moved their chairs closer together, the space between them charged with possibility. As they talked through Camus's philosophy of the absurd, their knees would occasionally touch, sending small electric shocks through Jake.

"You're really good at this," Alex said softly, looking up from the page to meet Jake's eyes.`,
      isPremium: false,
      choices: [
        {
          id: "choice-6a",
          text: "Suggest meeting again to study together",
          nextNodeId: "future-plans"
        },
        {
          id: "choice-6b",
          text: "Comment on how well you work together",
          nextNodeId: "natural-connection",
          isPremium: true,
          cost: 30
        }
      ]
    }
  ],
  "midnight-coffee": [
    {
      id: "start",
      storyId: "midnight-coffee",
      title: "Last Call",
      content: `Sam wiped down the counter for the hundredth time, glancing at the clock. 11:47 PM. Just thirteen more minutes until closing, and then they could finally—

The bell chimed. Sam looked up to see River, the regular who always ordered a double espresso no matter the hour. Tonight, though, River looked different. Nervous. Hesitant.

"Hey," River said softly, approaching the counter. "I know you're about to close, but..."`,
      isStartNode: true,
      isPremium: false,
      choices: [
        {
          id: "choice-1a",
          text: "Smile and ask what they'd like",
          nextNodeId: "usual-order"
        },
        {
          id: "choice-1b",
          text: "Notice they seem upset and ask if they're okay",
          nextNodeId: "caring-response"
        }
      ]
    },
    {
      id: "usual-order",
      storyId: "midnight-coffee",
      title: "Something Different",
      content: `"The usual?" Sam asked, already reaching for the espresso cups. They had River's order memorized: double espresso, no sugar, extra hot.

But River shook their head, surprising them both. "Actually... could I get something sweet tonight? Maybe a caramel latte?"

Sam paused, steam wand in hand. In the six months River had been coming here, they'd never deviated from their order. Something was definitely different tonight.

"Sure," Sam said softly, beginning to work the espresso machine. "Rough day?"`,
      isPremium: false,
      choices: [
        {
          id: "choice-2a",
          text: "Listen as they open up about their day",
          nextNodeId: "heart-to-heart"
        },
        {
          id: "choice-2b",
          text: "Offer to make it extra special",
          nextNodeId: "comfort-drink",
          isPremium: true,
          cost: 25
        }
      ]
    },
    {
      id: "caring-response",
      storyId: "midnight-coffee",
      title: "Unexpected Kindness",
      content: `Sam set down the cloth they'd been using and gave River their full attention. "Hey, are you okay? You seem... different tonight."

River's composure cracked slightly, and they looked down at their hands. "I just... I got some news today. Nothing terrible, just... life-changing, you know?"

The coffee shop felt smaller suddenly, more intimate. Sam came around the counter and gestured to the chairs. "Want to sit? I can make us both something while we talk."`,
      isPremium: false,
      choices: [
        {
          id: "choice-3a",
          text: "Ask if they want to share what happened",
          nextNodeId: "deeper-connection"
        },
        {
          id: "choice-3b", 
          text: "Simply be present and listen",
          nextNodeId: "quiet-understanding"
        }
      ]
    }
  ]
};

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
    // Use sample stories for testing
    const filtered = category && category !== 'all' ? 
      sampleStories.filter(story => story.category === category) : 
      sampleStories;
    
    return filtered.map(story => ({
      ...story,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }

  async getFeaturedStory(): Promise<Story | undefined> {
    // Return sample featured story
    const featured = sampleStories.find(story => story.isFeatured);
    return featured ? {
      ...featured,
      createdAt: new Date(),
      updatedAt: new Date()
    } : undefined;
  }

  async getStory(id: string): Promise<Story | undefined> {
    // Return sample story by ID
    const story = sampleStories.find(s => s.id === id);
    return story ? {
      ...story,
      createdAt: new Date(),
      updatedAt: new Date()
    } : undefined;
  }

  async createStory(storyData: InsertStory): Promise<Story> {
    const [story] = await db.insert(stories).values(storyData).returning();
    return story;
  }

  // Story node operations
  async getStoryNodes(storyId: string): Promise<StoryNode[]> {
    // Return sample nodes for the story
    const nodes = sampleNodes[storyId as keyof typeof sampleNodes] || [];
    return nodes.map(node => ({
      id: node.id,
      storyId: node.storyId,
      title: node.title,
      content: node.content,
      order: 1,
      isStarting: node.isStartNode || false,
      createdAt: new Date()
    }));
  }

  async getStoryNode(id: string): Promise<StoryNode | undefined> {
    // Find node across all sample stories
    for (const storyId in sampleNodes) {
      const nodes = sampleNodes[storyId as keyof typeof sampleNodes];
      const node = nodes.find(n => n.id === id);
      if (node) {
        return {
          id: node.id,
          storyId: node.storyId,
          title: node.title,
          content: node.content,
          order: 1,
          isStarting: node.isStartNode || false,
          createdAt: new Date()
        };
      }
    }
    return undefined;
  }

  async getStartingNode(storyId: string): Promise<StoryNode | undefined> {
    // Return the starting node for the story
    const nodes = sampleNodes[storyId as keyof typeof sampleNodes] || [];
    const startNode = nodes.find(node => node.isStartNode);
    return startNode ? {
      id: startNode.id,
      storyId: startNode.storyId,
      title: startNode.title,
      content: startNode.content,
      order: 1,
      isStarting: true,
      createdAt: new Date()
    } : undefined;
  }

  async createStoryNode(nodeData: InsertStoryNode): Promise<StoryNode> {
    const [node] = await db.insert(storyNodes).values(nodeData).returning();
    return node;
  }

  // Story choice operations
  async getChoicesFromNode(nodeId: string): Promise<StoryChoice[]> {
    // Find choices from sample nodes
    for (const storyId in sampleNodes) {
      const nodes = sampleNodes[storyId as keyof typeof sampleNodes];
      const node = nodes.find(n => n.id === nodeId);
      if (node && node.choices) {
        return node.choices.map((choice, index) => ({
          id: choice.id,
          fromNodeId: nodeId,
          toNodeId: choice.nextNodeId,
          text: choice.text,
          order: index + 1,
          isPremium: choice.isPremium || false,
          diamondCost: choice.cost || 0,
          createdAt: new Date()
        }));
      }
    }
    return [];
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
