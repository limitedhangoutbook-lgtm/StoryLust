import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for Replit Auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table (required for Replit Auth)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["guest", "registered", "admin", "mega-admin"] }).default("registered"),
  eggplants: integer("eggplants").default(20),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stories table
export const stories = pgTable("stories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imageUrl: text("image_url").notNull(),

  spiceLevel: integer("spice_level").notNull(), // 1-3 (🌶️ to 🌶️🌶️🌶️)
  category: varchar("category").notNull(), // 'straight', 'lgbt', 'all'
  wordCount: integer("word_count").notNull(),
  pathCount: integer("path_count").notNull(),
  isFeatured: boolean("is_featured").default(false),
  isPublished: boolean("is_published").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Story chapters/nodes
export const storyNodes = pgTable("story_nodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  storyId: varchar("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  isStarting: boolean("is_starting").default(false),
  order: integer("order").notNull(),
  nextNodeId: varchar("next_node_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Story choices (PAGE-BASED SYSTEM)
export const storyChoices = pgTable("story_choices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromNodeId: varchar("from_node_id").notNull().references(() => storyNodes.id, { onDelete: "cascade" }),
  toNodeId: varchar("to_node_id").notNull().references(() => storyNodes.id, { onDelete: "cascade" }),
  choiceText: text("choice_text").notNull(),
  isPremium: boolean("is_premium").default(false),
  eggplantCost: integer("eggplant_cost").default(0),
  order: integer("order").notNull(),
  targetPage: integer("target_page"), // PAGE-BASED NAVIGATION - page number reference
  targetPageId: varchar("target_page_id"), // PAGE-BASED NAVIGATION - page id reference for new stories
  createdAt: timestamp("created_at").defaultNow(),
});

// User reading progress (PAGE-BASED ONLY)
export const readingProgress = pgTable("reading_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storyId: varchar("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  currentPage: integer("current_page").notNull().default(1), // PAGE-BASED: track page number (1, 2, 3...)
  isBookmarked: boolean("is_bookmarked").default(false),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  lastReadAt: timestamp("last_read_at").defaultNow(),
  totalReadingTimeMinutes: integer("total_reading_time_minutes").default(0),
  pagesRead: integer("pages_read").default(0),
  choicesMade: integer("choices_made").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique().on(table.userId, table.storyId),
]);

// Personal bookmarks for specific story moments
export const personalBookmarks = pgTable("personal_bookmarks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storyId: varchar("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  nodeId: varchar("node_id").notNull().references(() => storyNodes.id, { onDelete: "cascade" }),
  title: text("title").notNull(), // User's custom bookmark title
  notes: text("notes"), // Optional personal notes
  isPrivate: boolean("is_private").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Reading sessions for detailed analytics
export const readingSessions = pgTable("reading_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storyId: varchar("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  startNodeId: varchar("start_node_id").notNull().references(() => storyNodes.id),
  endNodeId: varchar("end_node_id").references(() => storyNodes.id),
  startTime: timestamp("start_time").defaultNow(),
  endTime: timestamp("end_time"),
  pagesRead: integer("pages_read").default(0),
  choicesMade: integer("choices_made").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User choice history
export const userChoices = pgTable("user_choices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storyId: varchar("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  choiceId: varchar("choice_id").notNull().references(() => storyChoices.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Premium paths purchased by users - once bought, forever accessible
export const purchasedPremiumPaths = pgTable("purchased_premium_paths", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storyId: varchar("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  choiceId: varchar("choice_id").notNull().references(() => storyChoices.id, { onDelete: "cascade" }),
  eggplantCost: integer("eggplant_cost").notNull(), // Track what they paid
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique().on(table.userId, table.choiceId), // Each user can only buy each choice once
]);

// VIP Author Messages table (simple implementation)
export const authorMessages = pgTable("author_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").notNull(),
  fromUserEmail: varchar("from_user_email").notNull(),
  authorEmail: varchar("author_email").notNull(), // Author's email 
  storyTitle: text("story_title"), // Optional story context
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const storiesRelations = relations(stories, ({ many }) => ({
  nodes: many(storyNodes),
  readingProgress: many(readingProgress),
}));

export const storyNodesRelations = relations(storyNodes, ({ one, many }) => ({
  story: one(stories, {
    fields: [storyNodes.storyId],
    references: [stories.id],
  }),
  fromChoices: many(storyChoices, { relationName: "fromNode" }),
  toChoices: many(storyChoices, { relationName: "toNode" }),
}));

export const storyChoicesRelations = relations(storyChoices, ({ one }) => ({
  fromNode: one(storyNodes, {
    fields: [storyChoices.fromNodeId],
    references: [storyNodes.id],
    relationName: "fromNode",
  }),
  toNode: one(storyNodes, {
    fields: [storyChoices.toNodeId],
    references: [storyNodes.id],
    relationName: "toNode",
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  readingProgress: many(readingProgress),
  userChoices: many(userChoices),
  personalBookmarks: many(personalBookmarks),
  readingSessions: many(readingSessions),
  purchasedPremiumPaths: many(purchasedPremiumPaths),
}));

export const personalBookmarksRelations = relations(personalBookmarks, ({ one }) => ({
  user: one(users, {
    fields: [personalBookmarks.userId],
    references: [users.id],
  }),
  story: one(stories, {
    fields: [personalBookmarks.storyId],
    references: [stories.id],
  }),
  node: one(storyNodes, {
    fields: [personalBookmarks.nodeId],
    references: [storyNodes.id],
  }),
}));

export const readingSessionsRelations = relations(readingSessions, ({ one }) => ({
  user: one(users, {
    fields: [readingSessions.userId],
    references: [users.id],
  }),
  story: one(stories, {
    fields: [readingSessions.storyId],
    references: [stories.id],
  }),
  startNode: one(storyNodes, {
    fields: [readingSessions.startNodeId],
    references: [storyNodes.id],
  }),
}));

export const readingProgressRelations = relations(readingProgress, ({ one }) => ({
  user: one(users, {
    fields: [readingProgress.userId],
    references: [users.id],
  }),
  story: one(stories, {
    fields: [readingProgress.storyId],
    references: [stories.id],
  }),
  // Removed currentNode relation since we're using page-based navigation only
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStorySchema = createInsertSchema(stories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertStoryNodeSchema = createInsertSchema(storyNodes).omit({
  id: true,
  createdAt: true,
});

export const insertStoryChoiceSchema = createInsertSchema(storyChoices).omit({
  id: true,
  createdAt: true,
});

export const insertReadingProgressSchema = createInsertSchema(readingProgress).omit({
  id: true,
  createdAt: true,
});

export const insertUserChoiceSchema = createInsertSchema(userChoices).omit({
  id: true,
  createdAt: true,
});

export const userChoicesRelations = relations(userChoices, ({ one }) => ({
  user: one(users, {
    fields: [userChoices.userId],
    references: [users.id],
  }),
  story: one(stories, {
    fields: [userChoices.storyId],
    references: [stories.id],
  }),
  choice: one(storyChoices, {
    fields: [userChoices.choiceId],
    references: [storyChoices.id],
  }),
}));

export const purchasedPremiumPathsRelations = relations(purchasedPremiumPaths, ({ one }) => ({
  user: one(users, {
    fields: [purchasedPremiumPaths.userId],
    references: [users.id],
  }),
  story: one(stories, {
    fields: [purchasedPremiumPaths.storyId],
    references: [stories.id],
  }),
  choice: one(storyChoices, {
    fields: [purchasedPremiumPaths.choiceId],
    references: [storyChoices.id],
  }),
}));

export const insertPurchasedPremiumPathSchema = createInsertSchema(purchasedPremiumPaths).omit({
  id: true,
  createdAt: true,
});

export const insertPersonalBookmarkSchema = createInsertSchema(personalBookmarks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReadingSessionSchema = createInsertSchema(readingSessions).omit({
  id: true,
  createdAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Story = typeof stories.$inferSelect;
export type StoryNode = typeof storyNodes.$inferSelect;
export type StoryChoice = typeof storyChoices.$inferSelect;
export type ReadingProgress = typeof readingProgress.$inferSelect;
export type InsertReadingProgress = typeof readingProgress.$inferInsert;
export type UserChoice = typeof userChoices.$inferSelect;
export type InsertUserChoice = typeof userChoices.$inferInsert;
export type PersonalBookmark = typeof personalBookmarks.$inferSelect;
export type InsertPersonalBookmark = typeof personalBookmarks.$inferInsert;
export type ReadingSession = typeof readingSessions.$inferSelect;
export type InsertReadingSession = typeof readingSessions.$inferInsert;
export type AuthorMessage = typeof authorMessages.$inferSelect;
export type InsertAuthorMessage = typeof authorMessages.$inferInsert;

export type InsertStory = z.infer<typeof insertStorySchema>;
export type InsertStoryNode = z.infer<typeof insertStoryNodeSchema>;
export type InsertStoryChoice = z.infer<typeof insertStoryChoiceSchema>;
