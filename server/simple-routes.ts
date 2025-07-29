import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./simple-storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { db } from "./db";
import { and, eq, gt } from "drizzle-orm";
import { storyNodes, insertUserChoiceSchema, insertReadingProgressSchema } from "@shared/schema";
import { z } from "zod";

export async function registerSimpleRoutes(app: Express): Promise<Server> {
  // Auth setup
  await setupAuth(app);

  // === USER ROUTES ===
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    res.json(user);
  });

  // === STORY ROUTES ===
  app.get('/api/stories', async (req, res) => {
    const stories = await storage.getAllStories();
    res.json(stories);
  });

  app.get('/api/stories/featured', async (req, res) => {
    const story = await storage.getFeaturedStory();
    res.json(story);
  });

  app.get('/api/stories/:id', async (req, res) => {
    const story = await storage.getStory(req.params.id);
    if (!story) return res.status(404).json({ message: "Story not found" });
    res.json(story);
  });

  // === NODE & CHOICE ROUTES ===
  app.get('/api/nodes/:nodeId', async (req, res) => {
    const node = await storage.getStoryNode(req.params.nodeId);
    if (!node) return res.status(404).json({ message: "Node not found" });
    res.json(node);
  });

  app.get('/api/nodes/:nodeId/choices', async (req, res) => {
    const choices = await storage.getChoicesFromNode(req.params.nodeId);
    res.json(choices);
  });

  // Get next page in story progression
  app.get('/api/stories/:storyId/next/:currentNodeId', async (req, res) => {
    try {
      const { storyId, currentNodeId } = req.params;
      
      // Get current node's order to find the next sequential node
      const currentNode = await storage.getStoryNode(currentNodeId);
      if (!currentNode) {
        return res.status(404).json({ message: "Current node not found" });
      }
      
      // Find next node in sequence
      const [nextNode] = await db
        .select()
        .from(storyNodes)
        .where(and(
          eq(storyNodes.storyId, storyId),
          gt(storyNodes.order, currentNode.order)
        ))
        .orderBy(storyNodes.order)
        .limit(1);
      
      if (nextNode) {
        res.json(nextNode);
      } else {
        res.status(404).json({ message: "No next page found" });
      }
    } catch (error) {
      console.error("Error fetching next page:", error);
      res.status(500).json({ message: "Failed to fetch next page" });
    }
  });

  // === CHOICE SELECTION ===
  app.post('/api/choices/:choiceId/select', async (req: any, res) => {
    try {
      const choice = await storage.getStoryChoice(req.params.choiceId);
      if (!choice) return res.status(404).json({ message: "Choice not found" });

      // Handle premium choices
      if (choice.isPremium) {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ message: "Authentication required for premium choices" });
        }

        const userId = req.user.claims.sub;
        const user = await storage.getUser(userId);
        const cost = choice.diamondCost || 0;

        if (!user || (user.diamonds || 0) < cost) {
          return res.status(400).json({ message: "Insufficient diamonds" });
        }

        // Deduct diamonds
        if (cost > 0) {
          await storage.updateUserDiamonds(userId, (user.diamonds || 0) - cost);
        }

        // Save user choice
        await storage.saveUserChoice({
          userId,
          storyId: req.body.storyId,
          choiceId: req.params.choiceId,
        });
      }

      // Get target node
      const targetNode = await storage.getStoryNode(choice.toNodeId);
      
      res.json({ choice, targetNode });
    } catch (error) {
      console.error("Error selecting choice:", error);
      res.status(500).json({ message: "Failed to select choice" });
    }
  });

  // === READING PROGRESS ===
  app.get('/api/reading-progress/:storyId', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const userId = req.user.claims.sub;
    const progress = await storage.getStoryProgress(userId, req.params.storyId);
    res.json(progress);
  });

  app.post('/api/reading-progress', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const progressData = insertReadingProgressSchema.parse({
      ...req.body,
      userId,
    });

    const progress = await storage.upsertReadingProgress(progressData);
    res.json(progress);
  });

  app.post('/api/reading-progress/:storyId/bookmark', async (req: any, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.claims.sub;
    const progress = await storage.toggleBookmark(userId, req.params.storyId);
    res.json(progress);
  });

  // === USER MANAGEMENT (ADMIN ONLY) ===
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    const user = await storage.getUser(req.user.claims.sub);
    if (user?.role !== "mega-admin") {
      return res.status(403).json({ message: "Access denied" });
    }
    
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.post('/api/admin/users/:userId/role', isAuthenticated, async (req: any, res) => {
    const user = await storage.getUser(req.user.claims.sub);
    if (user?.role !== "mega-admin") {
      return res.status(403).json({ message: "Access denied" });
    }

    const { role } = req.body;
    const updatedUser = await storage.updateUserRole(req.params.userId, role);
    res.json(updatedUser);
  });

  // === USER READING HISTORY ===
  app.get('/api/my-reading', isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const progress = await storage.getUserReadingProgress(userId);
    res.json(progress);
  });

  const httpServer = createServer(app);
  return httpServer;
}