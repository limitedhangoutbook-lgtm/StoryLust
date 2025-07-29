import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { storyManager } from "./story-manager";
import Stripe from "stripe";
import { 
  insertStorySchema, 
  insertStoryNodeSchema, 
  insertStoryChoiceSchema,
  insertReadingProgressSchema,
  insertUserChoiceSchema 
} from "@shared/schema";
import { z } from "zod";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
});

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

  // User stats route
  app.get('/api/user/stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
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

  // Import unified story manager and creation manager
  const { getUnifiedStory, getStoryPage } = await import('./unified-story-manager.js');
  const { storyCreationManager } = await import('./story-creation-manager.js');

  app.get('/api/stories/featured', async (req, res) => {
    try {
      const story = await storage.getFeaturedStory();
      res.json(story);
    } catch (error) {
      console.error("Error fetching featured story:", error);
      res.status(500).json({ message: "Failed to fetch featured story" });
    }
  });

  // New unified story endpoint
  app.get('/api/stories/:storyId/complete', async (req, res) => {
    try {
      const unifiedStory = getUnifiedStory(req.params.storyId);
      if (!unifiedStory) {
        return res.status(404).json({ message: "Story not found" });
      }
      res.json(unifiedStory);
    } catch (error) {
      console.error("Error fetching unified story:", error);
      res.status(500).json({ message: "Failed to fetch story" });
    }
  });

  // New unified choice endpoint
  app.post('/api/stories/:storyId/choice', async (req, res) => {
    try {
      const { choiceId, currentPageId, nextPageId, isPremium, diamondCost } = req.body;
      
      // For premium choices, require authentication
      if (isPremium && req.isAuthenticated()) {
        const userId = (req.user as any).claims.sub;
        
        // Check diamonds for premium choices
        if (diamondCost > 0) {
          const user = await storage.getUser(userId);
          const userDiamonds = user?.diamonds || 0;
          
          if (userDiamonds < diamondCost) {
            return res.status(400).json({ message: "Insufficient diamonds" });
          }

          // Deduct diamonds
          await storage.updateUserDiamonds(userId, userDiamonds - diamondCost);
        }
      } else if (isPremium) {
        return res.status(401).json({ message: "Authentication required for premium choices" });
      }

      // Get the target page
      const targetPage = getStoryPage(req.params.storyId, nextPageId);
      
      res.json({ 
        success: true,
        nextPageId,
        targetPage,
        diamondsSpent: isPremium ? diamondCost : 0 
      });
    } catch (error) {
      console.error("Error processing choice:", error);
      res.status(500).json({ message: "Failed to process choice" });
    }
  });

  // Story creation endpoint - Admin only
  app.post('/api/stories/create', isAuthenticated, async (req, res) => {
    try {
      // Check if user is admin
      const userId = (req.user as any)?.claims?.sub;
      const user = await storage.getUser(userId);
      
      if (!user || (user.role !== "admin" && user.role !== "mega-admin")) {
        return res.status(403).json({ message: "Access denied: Admin writers only" });
      }

      const validation = storyCreationManager.validateStoryStructure(req.body);
      if (!validation.valid) {
        return res.status(400).json({ 
          message: "Invalid story structure", 
          errors: validation.errors 
        });
      }

      const storyId = await storyCreationManager.createStoryFromData(req.body);
      res.json({ success: true, storyId });
    } catch (error) {
      console.error("Error creating story:", error);
      res.status(500).json({ message: "Failed to create story" });
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
      // Add cache headers for better performance
      res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
      
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
      // Add cache headers for better performance
      res.set('Cache-Control', 'public, max-age=300'); // 5 minutes
      
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
      const progressList = await storage.getUserReadingProgress(userId);
      
      // Fetch story details for each progress entry
      const progressWithStories = await Promise.all(
        progressList.map(async (progress) => {
          const story = await storage.getStory(progress.storyId);
          return {
            ...progress,
            story: story || null
          };
        })
      );
      
      res.json(progressWithStories);
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

  // Choice routes (conditionally protected based on choice type)
  app.post('/api/choices/:choiceId/select', async (req: any, res) => {
    try {
      const choice = await storage.getStoryChoice(req.params.choiceId);
      
      if (!choice) {
        return res.status(404).json({ message: "Choice not found" });
      }

      // For premium choices, require authentication
      if (choice.isPremium) {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ message: "Authentication required for premium choices" });
        }

        const userId = req.user.claims.sub;
        
        // Check if user has enough diamonds for premium choice
        if ((choice.diamondCost || 0) > 0) {
          const user = await storage.getUser(userId);
          const userDiamonds = user?.diamonds || 0;
          const choiceCost = choice.diamondCost || 0;
          
          if (!user || userDiamonds < choiceCost) {
            return res.status(400).json({ message: "Insufficient diamonds" });
          }

          // Deduct diamonds
          await storage.updateUserDiamonds(userId, userDiamonds - choiceCost);
        }

        // Save user choice for authenticated users
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
          diamondsSpent: choice.diamondCost || 0 
        });
      } else {
        // For free choices, no authentication needed - just return the target node
        const targetNode = await storage.getStoryNode(choice.toNodeId);
        
        res.json({ 
          choice, 
          targetNode,
          diamondsSpent: 0 
        });
      }
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

  // Get choices for a story node
  app.get("/api/nodes/:nodeId/choices", async (req, res) => {
    try {
      const { nodeId } = req.params;
      const choices = storyManager.getStoryChoices(nodeId);
      res.json(choices);
    } catch (error) {
      console.error("Error fetching choices:", error);
      res.status(500).json({ message: "Failed to fetch choices" });
    }
  });

  // Get next page in story progression
  app.get("/api/stories/:storyId/next/:currentNodeId", async (req, res) => {
    try {
      const { storyId, currentNodeId } = req.params;
      const nextNode = storyManager.getNextPage(storyId, currentNodeId);
      
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

  // Stripe payment route for diamond purchases
  app.post("/api/create-payment-intent", isAuthenticated, async (req, res) => {
    try {
      const { amount, packageId } = req.body;
      const userId = (req as any).user.claims.sub;
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          userId,
          packageId,
          type: "diamond_purchase"
        },
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Payment intent creation failed:", error);
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Add diamonds to user account (webhook handler)
  app.post("/api/add-diamonds", isAuthenticated, async (req, res) => {
    try {
      const { packageId } = req.body;
      const userId = (req as any).user.claims.sub;
      
      // Diamond package mapping
      const packages: Record<string, { diamonds: number; bonus: number }> = {
        starter: { diamonds: 100, bonus: 0 },
        popular: { diamonds: 300, bonus: 50 },
        premium: { diamonds: 600, bonus: 150 },
        mega: { diamonds: 1200, bonus: 400 }
      };
      
      const pkg = packages[packageId];
      if (!pkg) {
        return res.status(400).json({ message: "Invalid package" });
      }
      
      const totalDiamonds = pkg.diamonds + pkg.bonus;
      await storage.addUserDiamonds(userId, totalDiamonds);
      
      res.json({ 
        success: true, 
        diamondsAdded: totalDiamonds,
        message: `${totalDiamonds} diamonds added to your account!`
      });
    } catch (error) {
      console.error("Error adding diamonds:", error);
      res.status(500).json({ message: "Failed to add diamonds" });
    }
  });

  // User management endpoints - Mega-Admin only
  app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.claims?.sub;
      const currentUser = await storage.getUser(userId);
      
      if (!currentUser || currentUser.role !== "mega-admin") {
        return res.status(403).json({ message: "Access denied: Mega-admin only" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put('/api/users/:userId/role', isAuthenticated, async (req, res) => {
    try {
      const currentUserId = (req.user as any)?.claims?.sub;
      const currentUser = await storage.getUser(currentUserId);
      
      if (!currentUser || currentUser.role !== "mega-admin") {
        return res.status(403).json({ message: "Access denied: Mega-admin only" });
      }

      const { userId } = req.params;
      const { role } = req.body;

      // Validate role
      const validRoles = ["guest", "registered", "admin", "mega-admin"];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      // Prevent changing own role
      if (userId === currentUserId) {
        return res.status(400).json({ message: "Cannot change your own role" });
      }

      const updatedUser = await storage.updateUserRole(userId, role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
