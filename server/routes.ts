import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { db } from "./db";
import { and, eq, gt } from "drizzle-orm";
import { storyNodes, insertUserChoiceSchema, insertReadingProgressSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Get starting node for a story (more specific routes first)
  app.get('/api/stories/:storyId/start', async (req, res) => {
    const startingNode = await storage.getFirstStoryNode(req.params.storyId);
    if (!startingNode) {
      return res.status(404).json({ message: "Starting node not found" });
    }
    res.json(startingNode);
  });

  app.get('/api/stories/:storyId/nodes/start', async (req, res) => {
    const startingNode = await storage.getFirstStoryNode(req.params.storyId);
    if (!startingNode) {
      return res.status(404).json({ message: "Starting node not found" });
    }
    res.json(startingNode);
  });

  // Get story by ID (more general route last)
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
      const [currentNode] = await db
        .select()
        .from(storyNodes)
        .where(and(
          eq(storyNodes.storyId, storyId),
          eq(storyNodes.id, currentNodeId)
        ));
      
      if (!currentNode) {
        return res.status(404).json({ message: "Current node not found" });
      }
      
      // Find the next node in sequence
      const [nextNode] = await db
        .select()
        .from(storyNodes)
        .where(and(
          eq(storyNodes.storyId, storyId),
          gt(storyNodes.order, currentNode.order)
        ))
        .orderBy(storyNodes.order)
        .limit(1);
      
      if (!nextNode) {
        return res.status(404).json({ message: "No next page found" });
      }
      
      res.json(nextNode);
    } catch (error) {
      console.error("Error getting next page:", error);
      res.status(500).json({ message: "Failed to get next page" });
    }
  });

  // === READING PROGRESS ROUTES ===
  app.get('/api/reading-progress/:storyId', isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const progress = await storage.getReadingProgress(userId, req.params.storyId);
    res.json(progress);
  });

  app.post('/api/reading-progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertReadingProgressSchema.parse(req.body);
      const progress = await storage.saveReadingProgress({
        ...validatedData,
        userId,
      });
      res.json(progress);
    } catch (error) {
      console.error("Error saving reading progress:", error);
      res.status(400).json({ message: "Invalid reading progress data" });
    }
  });

  // === USER CHOICE ROUTES ===
  app.post('/api/user-choices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const validatedData = insertUserChoiceSchema.parse(req.body);
      const choice = await storage.saveUserChoice({
        ...validatedData,
        userId,
      });
      res.json(choice);
    } catch (error) {
      console.error("Error saving user choice:", error);
      res.status(400).json({ message: "Invalid choice data" });
    }
  });

  // === USER MANAGEMENT ROUTES (MEGA-ADMIN ONLY) ===
  app.get('/api/admin/users', isAuthenticated, async (req: any, res) => {
    const currentUser = await storage.getUser(req.user.claims.sub);
    if (currentUser?.role !== 'mega-admin') {
      return res.status(403).json({ message: "Mega-admin access required" });
    }
    
    const users = await storage.getAllUsers();
    res.json(users);
  });

  app.post('/api/admin/users/:userId/role', isAuthenticated, async (req: any, res) => {
    const currentUser = await storage.getUser(req.user.claims.sub);
    if (currentUser?.role !== 'mega-admin') {
      return res.status(403).json({ message: "Mega-admin access required" });
    }

    const { role } = req.body;
    if (!['guest', 'registered', 'admin', 'mega-admin'].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await storage.updateUserRole(req.params.userId, role);
    res.json(user);
  });

  // === CHOICE SELECTION ROUTES ===
  app.post('/api/choices/:choiceId/select', async (req, res) => {
    try {
      const { choiceId } = req.params;
      const { storyId, currentNodeId } = req.body;
      
      // Get the choice details
      const choice = await storage.getChoice(choiceId);
      if (!choice) {
        return res.status(404).json({ message: "Choice not found" });
      }
      
      // Get the target node
      const targetNode = await storage.getStoryNode(choice.toNodeId);
      if (!targetNode) {
        return res.status(404).json({ message: "Target node not found" });
      }
      
      // Save user choice if authenticated
      if (req.isAuthenticated?.()) {
        const userId = (req as any).user.claims.sub;
        await storage.saveUserChoice({
          userId,
          storyId,
          choiceId,
          fromNodeId: currentNodeId,
          toNodeId: choice.toNodeId,
        });
        
        // Save reading progress
        await storage.saveReadingProgress({
          userId,
          storyId,
          currentNodeId: choice.toNodeId,
          isBookmarked: false,
        });
      }
      
      res.json({
        targetNode,
        choice,
        success: true
      });
    } catch (error) {
      console.error("Error processing choice selection:", error);
      res.status(500).json({ message: "Failed to process your choice" });
    }
  });

  // === DIAMOND ROUTES ===
  app.post('/api/diamonds/spend', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user || (user.diamonds || 0) < amount) {
        return res.status(400).json({ message: "Insufficient diamonds" });
      }
      
      const updatedUser = await storage.updateUserDiamonds(userId, (user.diamonds || 0) - amount);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error spending diamonds:", error);
      res.status(500).json({ message: "Failed to spend diamonds" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}