import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertStorySchema, 
  insertStoryNodeSchema, 
  insertStoryChoiceSchema,
  insertReadingProgressSchema,
  insertUserChoiceSchema 
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Story routes
  app.get('/api/stories', async (req, res) => {
    try {
      const category = req.query.category as string;
      const stories = await storage.getAllStories(category);
      res.json(stories);
    } catch (error) {
      console.error("Error fetching stories:", error);
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });

  app.get('/api/stories/featured', async (req, res) => {
    try {
      const story = await storage.getFeaturedStory();
      res.json(story);
    } catch (error) {
      console.error("Error fetching featured story:", error);
      res.status(500).json({ message: "Failed to fetch featured story" });
    }
  });

  app.get('/api/stories/:id', async (req, res) => {
    try {
      const story = await storage.getStory(req.params.id);
      if (!story) {
        return res.status(404).json({ message: "Story not found" });
      }
      res.json(story);
    } catch (error) {
      console.error("Error fetching story:", error);
      res.status(500).json({ message: "Failed to fetch story" });
    }
  });

  app.get('/api/stories/:id/nodes', async (req, res) => {
    try {
      const nodes = await storage.getStoryNodes(req.params.id);
      res.json(nodes);
    } catch (error) {
      console.error("Error fetching story nodes:", error);
      res.status(500).json({ message: "Failed to fetch story nodes" });
    }
  });

  app.get('/api/stories/:id/start', async (req, res) => {
    try {
      const startingNode = await storage.getStartingNode(req.params.id);
      if (!startingNode) {
        return res.status(404).json({ message: "Starting node not found" });
      }
      res.json(startingNode);
    } catch (error) {
      console.error("Error fetching starting node:", error);
      res.status(500).json({ message: "Failed to fetch starting node" });
    }
  });

  app.get('/api/nodes/:id', async (req, res) => {
    try {
      const node = await storage.getStoryNode(req.params.id);
      if (!node) {
        return res.status(404).json({ message: "Node not found" });
      }
      res.json(node);
    } catch (error) {
      console.error("Error fetching node:", error);
      res.status(500).json({ message: "Failed to fetch node" });
    }
  });

  app.get('/api/nodes/:id/choices', async (req, res) => {
    try {
      const choices = await storage.getChoicesFromNode(req.params.id);
      res.json(choices);
    } catch (error) {
      console.error("Error fetching choices:", error);
      res.status(500).json({ message: "Failed to fetch choices" });
    }
  });

  // Reading progress routes (protected)
  app.get('/api/reading-progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getUserReadingProgress(userId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching reading progress:", error);
      res.status(500).json({ message: "Failed to fetch reading progress" });
    }
  });

  app.get('/api/reading-progress/:storyId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.getStoryProgress(userId, req.params.storyId);
      res.json(progress);
    } catch (error) {
      console.error("Error fetching story progress:", error);
      res.status(500).json({ message: "Failed to fetch story progress" });
    }
  });

  app.post('/api/reading-progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progressData = insertReadingProgressSchema.parse({
        ...req.body,
        userId,
      });
      
      const progress = await storage.upsertReadingProgress(progressData);
      res.json(progress);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error saving reading progress:", error);
      res.status(500).json({ message: "Failed to save reading progress" });
    }
  });

  app.post('/api/stories/:storyId/bookmark', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progress = await storage.toggleBookmark(userId, req.params.storyId);
      res.json(progress);
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      res.status(500).json({ message: "Failed to toggle bookmark" });
    }
  });

  // Choice routes (protected)
  app.post('/api/choices/:choiceId/select', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const choice = await storage.getStoryChoice(req.params.choiceId);
      
      if (!choice) {
        return res.status(404).json({ message: "Choice not found" });
      }

      // Check if user has enough diamonds for premium choice
      if (choice.isPremium && (choice.diamondCost || 0) > 0) {
        const user = await storage.getUser(userId);
        const userDiamonds = user?.diamonds || 0;
        const choiceCost = choice.diamondCost || 0;
        
        if (!user || userDiamonds < choiceCost) {
          return res.status(400).json({ message: "Insufficient diamonds" });
        }

        // Deduct diamonds
        await storage.updateUserDiamonds(userId, userDiamonds - choiceCost);
      }

      // Save user choice
      const userChoiceData = insertUserChoiceSchema.parse({
        userId,
        storyId: req.body.storyId,
        choiceId: req.params.choiceId,
      });
      
      await storage.saveUserChoice(userChoiceData);

      // Update reading progress to the target node
      const progressData = insertReadingProgressSchema.parse({
        userId,
        storyId: req.body.storyId,
        currentNodeId: choice.toNodeId,
      });
      
      const progress = await storage.upsertReadingProgress(progressData);
      
      // Get the target node
      const targetNode = await storage.getStoryNode(choice.toNodeId);
      
      res.json({ 
        choice, 
        progress, 
        targetNode,
        diamondsSpent: choice.isPremium ? (choice.diamondCost || 0) : 0 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error selecting choice:", error);
      res.status(500).json({ message: "Failed to select choice" });
    }
  });

  // User diamond routes (protected)
  app.get('/api/user/diamonds', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json({ diamonds: user?.diamonds || 0 });
    } catch (error) {
      console.error("Error fetching user diamonds:", error);
      res.status(500).json({ message: "Failed to fetch diamonds" });
    }
  });

  // Admin routes for adding content (you can remove these in production)
  app.post('/api/admin/stories', async (req, res) => {
    try {
      const storyData = insertStorySchema.parse(req.body);
      const story = await storage.createStory(storyData);
      res.json(story);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating story:", error);
      res.status(500).json({ message: "Failed to create story" });
    }
  });

  app.post('/api/admin/nodes', async (req, res) => {
    try {
      const nodeData = insertStoryNodeSchema.parse(req.body);
      const node = await storage.createStoryNode(nodeData);
      res.json(node);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating node:", error);
      res.status(500).json({ message: "Failed to create node" });
    }
  });

  app.post('/api/admin/choices', async (req, res) => {
    try {
      const choiceData = insertStoryChoiceSchema.parse(req.body);
      const choice = await storage.createStoryChoice(choiceData);
      res.json(choice);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating choice:", error);
      res.status(500).json({ message: "Failed to create choice" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
