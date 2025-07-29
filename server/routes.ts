import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { db } from "./db";
import { and, eq, gt, sql } from "drizzle-orm";
import { storyNodes, users } from "@shared/schema";

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
      
      // Handle premium choice diamond deduction
      if (choice.isPremium && (choice.diamondCost || 0) > 0) {
        if (!req.isAuthenticated?.()) {
          return res.status(401).json({ message: "Authentication required for premium choices" });
        }
        
        const userId = (req as any).user.claims.sub;
        const user = await storage.getUser(userId);
        const cost = choice.diamondCost || 0;
        
        if (!user || (user.diamonds || 0) < cost) {
          return res.status(400).json({ message: "Insufficient diamonds for this premium choice" });
        }
        
        // Deduct diamonds
        await storage.updateUserDiamonds(userId, (user.diamonds || 0) - cost);
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
      console.error("Error processing choice selection:", error);
      res.status(500).json({ message: "Failed to process your choice" });
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
      console.error("Error toggling bookmark:", error);
      res.status(500).json({ message: "Failed to toggle bookmark" });
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

      res.status(201).json(story);
    } catch (error) {
      console.error("Error creating story:", error);
      res.status(500).json({ message: "Failed to create story" });
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
                diamondCost: choice.diamondCost || 0,
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
      const { toNodeId, choiceText, isPremium, diamondCost } = req.body;
      
      if (!toNodeId || !choiceText) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const choice = await storage.createStoryChoice({
        fromNodeId,
        toNodeId,
        choiceText,
        isPremium,
        diamondCost,
      });

      res.status(201).json(choice);
    } catch (error) {
      console.error("Error creating story choice:", error);
      res.status(500).json({ message: "Failed to create story choice" });
    }
  });

  // === ADMIN DIAMOND MANAGEMENT ===
  app.post('/api/admin/grant-starting-diamonds', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'mega-admin') {
        return res.status(403).json({ message: "Mega-admin access required" });
      }

      // Grant 20 diamonds to all users who have null or 0 diamonds
      const result = await db
        .update(users)
        .set({ diamonds: 20, updatedAt: new Date() })
        .where(sql`${users.diamonds} IS NULL OR ${users.diamonds} = 0`)
        .returning();

      res.json({ 
        message: "Starting diamonds (20) granted to all users without diamonds",
        usersUpdated: result.length 
      });
    } catch (error) {
      console.error("Error granting starting diamonds:", error);
      res.status(500).json({ message: "Failed to grant starting diamonds" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}