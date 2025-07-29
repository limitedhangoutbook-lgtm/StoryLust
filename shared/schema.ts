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
  diamonds: integer("diamonds").default(20),
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
  nextNodeId: varchar("next_node_id").references(() => storyNodes.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Story choices
export const storyChoices = pgTable("story_choices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromNodeId: varchar("from_node_id").notNull().references(() => storyNodes.id, { onDelete: "cascade" }),
  toNodeId: varchar("to_node_id").notNull().references(() => storyNodes.id, { onDelete: "cascade" }),
  choiceText: text("choice_text").notNull(),
  isPremium: boolean("is_premium").default(false),
  diamondCost: integer("diamond_cost").default(0),
  order: integer("order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User reading progress
export const readingProgress = pgTable("reading_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storyId: varchar("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  currentNodeId: varchar("current_node_id").notNull().references(() => storyNodes.id, { onDelete: "cascade" }),
  isBookmarked: boolean("is_bookmarked").default(false),
  isCompleted: boolean("is_completed").default(false),
  completedAt: timestamp("completed_at"),
  lastReadAt: timestamp("last_read_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  unique().on(table.userId, table.storyId),
]);

// User choice history
export const userChoices = pgTable("user_choices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  storyId: varchar("story_id").notNull().references(() => stories.id, { onDelete: "cascade" }),
  choiceId: varchar("choice_id").notNull().references(() => storyChoices.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

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
  currentNode: one(storyNodes, {
    fields: [readingProgress.currentNodeId],
    references: [storyNodes.id],
  }),
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

// Types


export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Story = typeof stories.$inferSelect;
export type StoryNode = typeof storyNodes.$inferSelect;
export type StoryChoice = typeof storyChoices.$inferSelect;
export type ReadingProgress = typeof readingProgress.$inferSelect;
export type UserChoice = typeof userChoices.$inferSelect;
export type AuthorMessage = typeof authorMessages.$inferSelect;
export type InsertAuthorMessage = typeof authorMessages.$inferInsert;

export type InsertStory = z.infer<typeof insertStorySchema>;
export type InsertStoryNode = z.infer<typeof insertStoryNodeSchema>;
export type InsertStoryChoice = z.infer<typeof insertStoryChoiceSchema>;
export type InsertReadingProgress = z.infer<typeof insertReadingProgressSchema>;
export type InsertUserChoice = z.infer<typeof insertUserChoiceSchema>;
