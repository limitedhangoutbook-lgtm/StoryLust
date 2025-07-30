import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { db } from "./db";
import { and, eq, gt, sql } from "drizzle-orm";
import { storyNodes, users } from "@shared/schema";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-06-30.basil",
});

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

  // Get all pages for a story in order
  app.get("/api/stories/:storyId/pages", async (req, res) => {
    try {
      const pages = await storage.getStoryPages(req.params.storyId);
      res.json(pages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch story pages" });
    }
  });

  // Get next page in story progression
  app.get('/api/stories/:storyId/next/:currentNodeId', async (req, res) => {
    try {
      const { storyId, currentNodeId } = req.params;
      
      // Get current node to check for next_node_id
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
      
      // Check if current node has a direct next_node_id
      if (currentNode.nextNodeId) {
        const [nextNode] = await db
          .select()
          .from(storyNodes)
          .where(eq(storyNodes.id, currentNode.nextNodeId));
        
        if (nextNode) {
          return res.json(nextNode);
        }
      }
      
      // No next node found
      return res.status(404).json({ message: "No next page found" });
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
      const { storyId, currentNodeId, isBookmarked = false } = req.body;
      
      // Validate required fields manually since schema might be missing imports
      if (!storyId || !currentNodeId) {
        return res.status(400).json({ message: "storyId and currentNodeId are required" });
      }
      
      const progress = await storage.saveReadingProgress({
        userId,
        storyId,
        currentNodeId,
        isBookmarked,
      });
      res.json(progress);
    } catch (error) {
      console.error("Error saving reading progress:", error);
      res.status(500).json({ message: "Failed to save reading progress" });
    }
  });

  // === USER CHOICE ROUTES ===
  app.post('/api/user-choices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { storyId, choiceId, fromNodeId, toNodeId } = req.body;
      
      // Validate required fields manually  
      if (!storyId || !choiceId) {
        return res.status(400).json({ message: "storyId and choiceId are required" });
      }
      
      const choice = await storage.saveUserChoice({
        userId,
        storyId,
        choiceId,
      });
      res.json(choice);
    } catch (error) {
      console.error("Error saving user choice:", error);
      res.status(500).json({ message: "Failed to save user choice" });
    }
  });

  // === STORY COMPLETION ROUTES ===
  app.post('/api/stories/:storyId/complete', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { storyId } = req.params;
      
      const progress = await storage.markStoryCompleted(userId, storyId);
      res.json({ success: true, progress });
    } catch (error) {
      console.error("Error marking story completed:", error);
      res.status(500).json({ message: "Failed to mark story completed" });
    }
  });

  // === USER STATS ROUTES ===
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

  // === READING PROGRESS WITH STORY DATA ===
  app.get('/api/reading-progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const progressWithStories = await storage.getUserReadingProgressWithStories(userId);
      res.json(progressWithStories);
    } catch (error) {
      console.error("Error fetching reading progress with stories:", error);
      res.status(500).json({ message: "Failed to fetch reading progress" });
    }
  });

  // === START FROM BEGINNING ROUTE ===
  app.post('/api/stories/:storyId/start-from-beginning', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { storyId } = req.params;
      
      // Find the actual starting node for this story (order = 1)
      const startingNode = await storage.getStoryStartingNode(storyId);
      if (!startingNode) {
        return res.status(404).json({ message: "Story not found or no starting node" });
      }
      
      // Reset reading progress to the beginning
      const progress = await storage.saveReadingProgress({
        userId,
        storyId,
        currentNodeId: startingNode.id,
        isBookmarked: false
      });
      
      res.json({ success: true, progress, startingNodeId: startingNode.id });
    } catch (error) {
      console.error("Error resetting story progress:", error);
      res.status(500).json({ message: "Failed to reset story progress" });
    }
  });

  // === PERSONAL BOOKMARK ROUTES ===
  app.post('/api/bookmarks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { storyId, nodeId, title, notes } = req.body;
      
      if (!storyId || !nodeId || !title) {
        return res.status(400).json({ message: "storyId, nodeId, and title are required" });
      }
      
      const bookmark = await storage.createPersonalBookmark({
        userId,
        storyId,
        nodeId,
        title,
        notes,
      });
      res.json(bookmark);
    } catch (error) {
      console.error("Error creating bookmark:", error);
      res.status(500).json({ message: "Failed to create bookmark" });
    }
  });

  app.get('/api/bookmarks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { storyId } = req.query;
      const bookmarks = await storage.getPersonalBookmarks(userId, storyId as string);
      res.json(bookmarks);
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      res.status(500).json({ message: "Failed to fetch bookmarks" });
    }
  });

  app.put('/api/bookmarks/:bookmarkId', isAuthenticated, async (req: any, res) => {
    try {
      const { bookmarkId } = req.params;
      const { title, notes } = req.body;
      
      const bookmark = await storage.updatePersonalBookmark(bookmarkId, { title, notes });
      res.json(bookmark);
    } catch (error) {
      console.error("Error updating bookmark:", error);
      res.status(500).json({ message: "Failed to update bookmark" });
    }
  });

  app.delete('/api/bookmarks/:bookmarkId', isAuthenticated, async (req: any, res) => {
    try {
      const { bookmarkId } = req.params;
      await storage.deletePersonalBookmark(bookmarkId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting bookmark:", error);
      res.status(500).json({ message: "Failed to delete bookmark" });
    }
  });

  // === READING SESSION ROUTES ===
  app.post('/api/reading-sessions/start', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { storyId, startNodeId } = req.body;
      
      if (!storyId || !startNodeId) {
        return res.status(400).json({ message: "storyId and startNodeId are required" });
      }
      
      const session = await storage.startReadingSession({
        userId,
        storyId,
        startNodeId,
      });
      res.json(session);
    } catch (error) {
      console.error("Error starting reading session:", error);
      res.status(500).json({ message: "Failed to start reading session" });
    }
  });

  app.put('/api/reading-sessions/:sessionId', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const { pagesRead, choicesMade } = req.body;
      
      const session = await storage.updateReadingSession(sessionId, { pagesRead, choicesMade });
      res.json(session);
    } catch (error) {
      console.error("Error updating reading session:", error);
      res.status(500).json({ message: "Failed to update reading session" });
    }
  });

  app.post('/api/reading-sessions/:sessionId/end', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const { endNodeId } = req.body;
      
      const session = await storage.endReadingSession(sessionId, endNodeId);
      res.json(session);
    } catch (error) {
      console.error("Error ending reading session:", error);
      res.status(500).json({ message: "Failed to end reading session" });
    }
  });

  app.get('/api/reading-sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getUserReadingSessions(userId);
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching reading sessions:", error);
      res.status(500).json({ message: "Failed to fetch reading sessions" });
    }
  });

  // === READING ANALYTICS ROUTES ===
  app.get('/api/analytics/reading-stats', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getReadingStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching reading stats:", error);
      res.status(500).json({ message: "Failed to fetch reading stats" });
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
      
      // Check if this is a premium choice and handle payment/access
      if (choice.isPremium && (choice.eggplantCost || 0) > 0) {
        // Check if user is authenticated for premium content
        if (!req.isAuthenticated?.()) {
          return res.status(401).json({ message: "Login required for premium choices" });
        }

        const userId = (req as any).user.claims.sub;
        
        // Check if user has already purchased this premium path
        const alreadyPurchased = await storage.hasPurchasedPremiumPath(userId, choiceId);
        
        if (!alreadyPurchased) {
          // User hasn't purchased this path yet, check if they have enough diamonds
          const user = await storage.getUser(userId);
          const cost = choice.eggplantCost || 0;
          const userEggplants = user?.eggplants || 0;
          
          if (!user || userEggplants < cost) {
            return res.status(400).json({ 
              message: "Not enough eggplants for this premium choice",
              required: cost,
              available: userEggplants
            });
          }
          
          // Deduct eggplants and record the purchase
          await storage.updateUserEggplants(userId, userEggplants - cost);
          await storage.purchasePremiumPath({
            userId,
            storyId,
            choiceId,
            diamondCost: cost
          });
        }
        // If already purchased, user can access it for free forever
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
      res.status(500).json({ message: "Failed to process your choice" });
    }
  });

  // === START FROM BEGINNING ROUTE ===
  app.post('/api/stories/:storyId/start-from-beginning', async (req, res) => {
    try {
      const { storyId } = req.params;
      
      // Clear reading progress for authenticated users
      if (req.isAuthenticated?.()) {
        const userId = (req as any).user.claims.sub;
        
        // Delete existing reading progress to start fresh
        await storage.deleteReadingProgress(userId, storyId);
        
        // Clear choice history for this story
        await storage.clearUserChoiceHistory(userId, storyId);
        
        // End any active reading sessions
        const activeSession = await storage.getActiveReadingSession(userId, storyId);
        if (activeSession) {
          await storage.endReadingSession(activeSession.id);
        }
      }
      
      // Get the starting node
      const startingNode = await storage.getStoryStartingNode(storyId);
      if (!startingNode) {
        return res.status(404).json({ message: "Story starting node not found" });
      }
      
      res.json({
        success: true,
        startingNode,
        message: "Story reset to beginning"
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to reset story" });
    }
  });

  // === BOOKMARK ROUTES ===
  app.post('/api/stories/:storyId/bookmark', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { storyId } = req.params;
      
      // Get current reading progress
      const progress = await storage.getReadingProgress(userId, storyId);
      
      if (progress) {
        // Toggle bookmark status
        const updatedProgress = await storage.saveReadingProgress({
          userId,
          storyId,
          currentNodeId: progress.currentNodeId,
          isBookmarked: !progress.isBookmarked,
        });
        res.json({ isBookmarked: updatedProgress.isBookmarked });
      } else {
        // Create new progress with bookmark
        const story = await storage.getStory(storyId);
        if (!story) {
          return res.status(404).json({ message: "Story not found" });
        }
        
        const startingNode = await storage.getFirstStoryNode(storyId);
        if (!startingNode) {
          return res.status(404).json({ message: "Starting node not found" });
        }
        
        const newProgress = await storage.saveReadingProgress({
          userId,
          storyId,
          currentNodeId: startingNode.id,
          isBookmarked: true,
        });
        res.json({ isBookmarked: newProgress.isBookmarked });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to toggle bookmark" });
    }
  });

  // === EGGPLANT ROUTES ===
  app.post('/api/eggplants/spend', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { amount } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user || (user.eggplants || 0) < amount) {
        return res.status(400).json({ message: "Insufficient eggplants" });
      }
      
      const updatedUser = await storage.updateUserEggplants(userId, (user.eggplants || 0) - amount);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to spend eggplants" });
    }
  });

  // === ADMIN STORY ROUTES ===
  app.get('/api/admin/stories', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'mega-admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const allStories = await storage.getAllStoriesForAdmin();
      res.json(allStories);
    } catch (error) {
      console.error("Error fetching admin stories:", error);
      res.status(500).json({ message: "Failed to fetch stories" });
    }
  });

  app.get('/api/stories/:storyId/nodes', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'mega-admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { storyId } = req.params;
      const nodes = await storage.getStoryNodes(storyId);
      res.json(nodes);
    } catch (error) {
      console.error("Error fetching story nodes:", error);
      res.status(500).json({ message: "Failed to fetch story nodes" });
    }
  });

  // === STORY CREATION ROUTES (ADMIN ONLY) ===
  app.post('/api/stories/draft', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'mega-admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { title, description, imageUrl, spiceLevel, category, pages } = req.body;

      // Create story as draft (not published)
      const story = await storage.createStory({
        title: title || "Untitled Draft",
        description: description || "Draft story",
        imageUrl: imageUrl || "",
        spiceLevel: spiceLevel || 1,
        category: category || "straight",
        authorId: req.user.claims.sub,
        isPublished: false, // Always save as draft
        isFeatured: false,
      });

      // Create nodes and choices if pages exist
      if (pages && pages.length > 0) {
        const nodeMap: Record<string, string> = {};
        
        // First pass: create all nodes
        for (const page of pages) {
          const node = await storage.createStoryNode({
            storyId: story.id,
            title: page.title || `Page ${page.order}`,
            content: page.content || "",
            order: page.order,
            isStarting: page.order === 1,
            isEnding: page.isEnding || false,
          });
          nodeMap[page.id] = node.id;
        }

        // Second pass: create choices with correct node references
        for (const page of pages) {
          if (page.choices && page.choices.length > 0) {
            for (let i = 0; i < page.choices.length; i++) {
              const choice = page.choices[i];
              if (choice.text.trim() && choice.targetPageId && nodeMap[choice.targetPageId]) {
                await storage.createStoryChoice({
                  fromNodeId: nodeMap[page.id],
                  toNodeId: nodeMap[choice.targetPageId],
                  choiceText: choice.text,
                  order: i,
                  isPremium: choice.isPremium || false,
                  eggplantCost: choice.eggplantCost || 0,
                });
              }
            }
          }
        }
      }

      res.status(201).json({ 
        message: "Draft saved successfully",
        story: {
          id: story.id,
          title: story.title,
          isPublished: story.isPublished
        }
      });
    } catch (error) {
      console.error("Error saving story draft:", error);
      res.status(500).json({ message: "Failed to save story draft" });
    }
  });

  app.post('/api/stories', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'mega-admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { title, description, imageUrl, spiceLevel, category, wordCount, pathCount } = req.body;
      
      if (!title || !description || !imageUrl || !spiceLevel || !category) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const story = await storage.createStory({
        title,
        description,
        imageUrl,
        spiceLevel,
        category,
        wordCount,
        pathCount,
      });

      res.json(story);
    } catch (error) {
      console.error("Error creating story:", error);
      res.status(500).json({ message: "Failed to create story" });
    }
  });

  // Save story draft (ADMIN ONLY)
  app.post('/api/stories/draft', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'mega-admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const draftData = req.body;
      
      // For drafts, we only require title - other fields can be empty
      if (!draftData.title || draftData.title.trim() === '') {
        return res.status(400).json({ message: "Story title is required" });
      }

      // Save draft to localStorage or database (depending on your preference)
      // For now, we'll just return success - you can implement draft storage as needed
      res.json({ 
        success: true, 
        message: "Draft saved successfully",
        draft: draftData 
      });
    } catch (error) {
      console.error("Error saving draft:", error);
      res.status(500).json({ message: "Failed to save draft" });
    }
  });

  // Create complete story with pages and choices
  app.post('/api/stories/complete', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'mega-admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { title, description, imageUrl, spiceLevel, category, isPublished, isFeatured, pages, wordCount, pathCount } = req.body;
      
      if (!title || !description || !pages || pages.length === 0) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Create the story
      const story = await storage.createStory({
        title,
        description,
        imageUrl: imageUrl || '',
        spiceLevel,
        category,
        wordCount: wordCount || 0,
        pathCount: pathCount || 1,
      });

      // Create all pages/nodes
      const nodeMap: { [key: string]: string } = {}; // Map old IDs to new IDs
      
      for (const page of pages) {
        const node = await storage.createStoryNode({
          storyId: story.id,
          title: page.title,
          content: page.content,
          order: page.order,
          isStarting: page.order === 1,
        });
        nodeMap[page.id] = node.id;
      }

      // Create all choices
      for (const page of pages) {
        if (page.choices && page.choices.length > 0) {
          for (let i = 0; i < page.choices.length; i++) {
            const choice = page.choices[i];
            if (choice.text && choice.targetPageId && nodeMap[choice.targetPageId]) {
              await storage.createStoryChoice({
                fromNodeId: nodeMap[page.id],
                toNodeId: nodeMap[choice.targetPageId],
                choiceText: choice.text,
                order: i,
                isPremium: choice.isPremium || false,
                eggplantCost: choice.eggplantCost || 0,
              });
            }
          }
        }
      }

      // Update story publish status if needed
      if (isPublished || isFeatured) {
        await storage.updateStory(story.id, {
          isPublished: isPublished || false,
          isFeatured: isFeatured || false,
        });
      }

      res.status(201).json({
        story,
        message: "Story created successfully with all pages and choices"
      });
    } catch (error) {
      console.error("Error creating complete story:", error);
      res.status(500).json({ message: "Failed to create complete story" });
    }
  });

  app.put('/api/stories/:storyId', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'mega-admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { storyId } = req.params;
      const updates = req.body;
      
      const story = await storage.updateStory(storyId, updates);
      res.json(story);
    } catch (error) {
      console.error("Error updating story:", error);
      res.status(500).json({ message: "Failed to update story" });
    }
  });

  app.delete('/api/stories/:storyId', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'mega-admin') {
        return res.status(403).json({ message: "Mega-admin access required" });
      }

      const { storyId } = req.params;
      await storage.deleteStory(storyId);
      res.json({ message: "Story deleted successfully" });
    } catch (error) {
      console.error("Error deleting story:", error);
      res.status(500).json({ message: "Failed to delete story" });
    }
  });

  app.post('/api/stories/:storyId/nodes', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'mega-admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { storyId } = req.params;
      const { title, content, order, isStarting } = req.body;
      
      if (!title || !content || order === undefined) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const node = await storage.createStoryNode({
        storyId,
        title,
        content,
        order,
        isStarting,
      });

      res.status(201).json(node);
    } catch (error) {
      console.error("Error creating story node:", error);
      res.status(500).json({ message: "Failed to create story node" });
    }
  });

  app.put('/api/nodes/:nodeId', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'mega-admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { nodeId } = req.params;
      const updates = req.body;
      
      const node = await storage.updateStoryNode(nodeId, updates);
      res.json(node);
    } catch (error) {
      console.error("Error updating story node:", error);
      res.status(500).json({ message: "Failed to update story node" });
    }
  });

  app.delete('/api/nodes/:nodeId', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'mega-admin') {
        return res.status(403).json({ message: "Mega-admin access required" });
      }

      const { nodeId } = req.params;
      await storage.deleteStoryNode(nodeId);
      res.json({ message: "Story node deleted successfully" });
    } catch (error) {
      console.error("Error deleting story node:", error);
      res.status(500).json({ message: "Failed to delete story node" });
    }
  });

  app.post('/api/nodes/:fromNodeId/choices', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'mega-admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { fromNodeId } = req.params;
      const { toNodeId, choiceText, isPremium, eggplantCost } = req.body;
      
      if (!toNodeId || !choiceText) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const choice = await storage.createStoryChoice({
        fromNodeId,
        toNodeId,
        choiceText,
        isPremium,
        eggplantCost,
      });

      res.status(201).json(choice);
    } catch (error) {
      console.error("Error creating story choice:", error);
      res.status(500).json({ message: "Failed to create story choice" });
    }
  });

  // === ADMIN EGGPLANT MANAGEMENT ===
  app.post('/api/admin/grant-starting-eggplants', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'mega-admin') {
        return res.status(403).json({ message: "Mega-admin access required" });
      }

      // Grant 20 eggplants to all users who have null or 0 eggplants
      const result = await db
        .update(users)
        .set({ eggplants: 20, updatedAt: new Date() })
        .where(sql`${users.eggplants} IS NULL OR ${users.eggplants} = 0`)
        .returning();

      res.json({ 
        message: "Starting eggplants (20) granted to all users without eggplants",
        usersUpdated: result.length 
      });
    } catch (error) {
      console.error("Error granting starting eggplants:", error);
      res.status(500).json({ message: "Failed to grant starting eggplants" });
    }
  });

  // === EGGPLANT PURCHASE ROUTES ===
  app.post('/api/eggplants/create-payment', isAuthenticated, async (req: any, res) => {
    try {
      const { packageId, amount, eggplants } = req.body;
      const userId = req.user.claims.sub;

      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          userId,
          packageId,
          eggplants: eggplants.toString()
        },
        description: `Eggplant Purchase: ${eggplants} eggplants`
      });

      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      console.error("Error creating eggplant payment:", error);
      res.status(500).json({ message: "Error creating payment: " + error.message });
    }
  });

  // Stripe webhook to handle successful payments
  app.post('/api/eggplants/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      // In production, you'd set this as an environment variable
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test';
      event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the payment_intent.succeeded event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const { userId, eggplants } = paymentIntent.metadata;

      if (userId && eggplants) {
        try {
          // Add eggplants to user account
          await storage.addEggplantsToUser(userId, parseInt(eggplants));
          console.log(`Added ${eggplants} eggplants to user ${userId}`);
        } catch (error) {
          console.error('Error adding eggplants to user:', error);
        }
      }
    }

    res.json({ received: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}