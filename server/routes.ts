import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { analytics } from "./analytics/EventTracker";

import { db } from "./db";
import { and, eq, gt, sql } from "drizzle-orm";
import { storyPages, storyChoices, users } from "@shared/schema";

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

  // Get starting page for a story (more specific routes first)
  app.get('/api/stories/:storyId/start', async (req, res) => {
    const startingPage = await storage.getFirstStoryPage(req.params.storyId);
    if (!startingPage) {
      return res.status(404).json({ message: "Starting page not found" });
    }
    res.json(startingPage);
  });

  app.get('/api/stories/:storyId/pages/start', async (req, res) => {
    const startingPage = await storage.getFirstStoryPage(req.params.storyId);
    if (!startingPage) {
      return res.status(404).json({ message: "Starting page not found" });
    }
    res.json(startingPage);
  });

  // Get story by ID (more general route last)
  app.get('/api/stories/:id', async (req, res) => {
    const story = await storage.getStory(req.params.id);
    if (!story) return res.status(404).json({ message: "Story not found" });
    res.json(story);
  });

  // === PAGE-BASED CHOICES ROUTE (NO MORE NODES!) ===
  app.get('/api/pages/:pageNumber/choices', async (req, res) => {
    try {
      const { pageNumber } = req.params;
      const { storyId } = req.query;
      
      if (!storyId) {
        return res.status(400).json({ message: "storyId is required" });
      }
      
      // Get all pages for this story to find the page at the given position
      const allPages = await db
        .select()
        .from(storyPages)
        .where(eq(storyPages.storyId, storyId as string))
        .orderBy(storyPages.order);
      
      const pageIndex = parseInt(pageNumber as string) - 1; // Convert to 0-based index
      if (pageIndex < 0 || pageIndex >= allPages.length) {
        return res.json([]); // No choices for invalid page
      }
      
      const currentPageNode = allPages[pageIndex];
      
      // Get choices for this page using pure page-based logic
      const pageChoices = await db
        .select({
          id: storyChoices.id,
          choiceText: storyChoices.choiceText,
          isPremium: storyChoices.isPremium,
          eggplantCost: storyChoices.eggplantCost,
          targetPage: storyChoices.targetPage,
        })
        .from(storyChoices)
        .where(eq(storyChoices.fromPageId, currentPageNode.id))
        .orderBy(storyChoices.order);
      
      // Check which premium choices are already owned (if user is authenticated)
      let ownedChoices = new Set<string>();
      if (req.isAuthenticated()) {
        const userId = (req as any).user.claims.sub;
        const purchasedPaths = await storage.getUserPurchasedPaths(userId, storyId as string);
        ownedChoices = new Set(purchasedPaths.map(p => p.choiceId));
      }

      // Return pure page-based choices with ownership status
      const pageBased = pageChoices.map((choice) => {
        return {
          id: choice.id,
          choiceText: choice.choiceText,
          isPremium: choice.isPremium,
          eggplantCost: choice.eggplantCost,
          targetPage: choice.targetPage || (parseInt(pageNumber as string) + 1), // Default to next page
          isOwned: choice.isPremium && ownedChoices.has(choice.id), // Show ownership status
        };
      });

      res.json(pageBased);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to get page choices", error: error.message });
    }
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

  // Get first choice page for story re-exploration
  app.get("/api/stories/:storyId/first-choice-page", async (req, res) => {
    try {
      const { storyId } = req.params;
      const firstChoicePage = await storage.getFirstChoicePageNumber(storyId);
      
      res.json({
        storyId,
        firstChoicePageNumber: firstChoicePage || 5, // Fallback to page 5
        success: true
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to find first choice page" });
    }
  });

  // === STORY MAP ROUTE ===
  app.get('/api/stories/:storyId/map', async (req: any, res) => {
    try {
      const { storyId } = req.params;
      const useOptimizedLayout = req.query.optimized === 'true';
      
      // Get user's purchased paths if authenticated
      let ownedChoiceIds = new Set<string>();
      if (req.isAuthenticated()) {
        const userId = req.user.claims.sub;
        const purchasedPaths = await storage.getUserPurchasedPaths(userId, storyId);
        ownedChoiceIds = new Set(purchasedPaths.map(p => p.choiceId));
      }
      
      console.log('Calling getStoryMapData with:', { storyId, ownedChoiceIds: ownedChoiceIds.size });
      let mapData = await storage.getStoryMapData(storyId, ownedChoiceIds);
      console.log('Map data result:', { bubbleCount: mapData?.nodes?.length, choiceCount: mapData?.choices?.length });

      // Apply AI layout optimization if requested
      if (useOptimizedLayout && mapData) {
        const { storyLayoutGenerator } = await import('./services/storyLayoutGenerator');
        mapData = storyLayoutGenerator.generateOptimizedLayout(mapData);
      }
      
      res.json(mapData);
    } catch (error) {
      console.error('Error in story map route:', error);
      console.error('Error stack:', (error as Error).stack);
      res.status(500).json({ message: "Failed to fetch story map" });
    }
  });

  // Generate Mermaid code for story
  app.get('/api/stories/:storyId/mermaid', async (req: any, res) => {
    try {
      const { storyId } = req.params;
      
      // Get user's purchased paths if authenticated
      let ownedChoiceIds = new Set<string>();
      if (req.isAuthenticated()) {
        const userId = req.user.claims.sub;
        const purchasedPaths = await storage.getUserPurchasedPaths(userId, storyId);
        ownedChoiceIds = new Set(purchasedPaths.map(p => p.choiceId));
      }
      
      const mapData = await storage.getStoryMapData(storyId, ownedChoiceIds);
      if (!mapData) {
        return res.status(404).json({ message: 'Story not found' });
      }

      const { storyLayoutGenerator } = await import('./services/storyLayoutGenerator');
      const mermaidCode = storyLayoutGenerator.generateMermaidDefinition(mapData);
      
      res.json({ 
        mermaidCode,
        storyId,
        pageCount: mapData.nodes.length,
        choiceCount: mapData.choices.length
      });
    } catch (error) {
      console.error('Error generating Mermaid code:', error);
      res.status(500).json({ message: 'Failed to generate Mermaid diagram' });
    }
  });

  // PAGE-BASED NAVIGATION: No more node endpoints needed!

  // === READING PROGRESS ROUTES ===
  app.get('/api/reading-progress/:storyId', isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const progress = await storage.getReadingProgress(userId, req.params.storyId);
    res.json(progress);
  });

  app.post('/api/reading-progress', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { storyId, currentPage, pagesRead, isBookmarked = false } = req.body;
      
      // Validate required fields (page-based only)
      if (!storyId || !currentPage) {
        return res.status(400).json({ message: "storyId and currentPage are required" });
      }
      
      const progress = await storage.saveReadingProgress({
        userId,
        storyId,
        currentPage,
        pagesRead: pagesRead || currentPage,
        isBookmarked,
      });
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to save reading progress" });
    }
  });

  // === USER CHOICE ROUTES ===
  app.post('/api/user-choices', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { storyId, choiceId, fromPageId, toPageId } = req.body;
      
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
      res.status(500).json({ message: "Failed to fetch reading progress" });
    }
  });

  // === PERSONAL BOOKMARK ROUTES ===
  app.post('/api/bookmarks', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { storyId, pageNumber, title, notes } = req.body;
      
      if (!storyId || !pageNumber || !title) {
        return res.status(400).json({ message: "storyId, pageNumber, and title are required" });
      }
      
      // Get the current page for this page - simplified approach
      const pages = await storage.getStoryPages(storyId);
      const currentPage = pages.find(p => p.order === pageNumber);
      
      if (!currentPage) {
        return res.status(404).json({ message: "Page not found" });
      }
      
      const bookmark = await storage.createPersonalBookmark({
        userId,
        storyId,
        pageId: currentPage.id,
        title,
        notes,
      });
      res.json(bookmark);
    } catch (error) {

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

      res.status(500).json({ message: "Failed to update bookmark" });
    }
  });

  app.delete('/api/bookmarks/:bookmarkId', isAuthenticated, async (req: any, res) => {
    try {
      const { bookmarkId } = req.params;
      await storage.deletePersonalBookmark(bookmarkId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete bookmark" });
    }
  });

  // === READING SESSION ROUTES ===
  app.post('/api/reading-sessions/start', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { storyId, startPageId } = req.body;
      
      if (!storyId || !startPageId) {
        return res.status(400).json({ message: "storyId and startPageId are required" });
      }
      
      const session = await storage.startReadingSession({
        userId,
        storyId,
        startPageId,
      });
      res.json(session);
    } catch (error) {
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
      res.status(500).json({ message: "Failed to update reading session" });
    }
  });

  app.post('/api/reading-sessions/:sessionId/end', isAuthenticated, async (req: any, res) => {
    try {
      const { sessionId } = req.params;
      const { endPageNumber } = req.body;
      
      const session = await storage.endReadingSession(sessionId, endPageNumber);
      res.json(session);
    } catch (error) {
      res.status(500).json({ message: "Failed to end reading session" });
    }
  });

  app.get('/api/reading-sessions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const sessions = await storage.getUserReadingSessions(userId);
      res.json(sessions);
    } catch (error) {
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

  // Enhanced analytics with modular engine
  app.get('/api/analytics/conversion/:storyId?', async (req, res) => {
    try {
      const { storyId } = req.params;
      const metrics = analytics.getConversionMetrics(storyId);
      const choicePopularity = analytics.getChoicePopularity(storyId);
      
      res.json({
        metrics,
        choicePopularity,
        storyId: storyId || 'all-stories'
      });
    } catch (error) {
      console.error("Error fetching conversion analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
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

  // === PURCHASED PREMIUM PATHS ROUTES ===
  app.get('/api/purchased-paths/:storyId', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { storyId } = req.params;
      
      const paths = await storage.getUserPurchasedPaths(userId, storyId);
      res.json(paths);
    } catch (error) {
      console.error("Error fetching purchased paths:", error);
      res.status(500).json({ message: "Failed to fetch purchased paths" });
    }
  });

  // === CHOICE SELECTION ROUTES ===
  app.post('/api/choices/:choiceId/select', async (req, res) => {
    try {
      const { choiceId } = req.params;
      const { storyId, currentPage } = req.body;
      
      // Get the choice details
      const choice = await storage.getChoice(choiceId);
      if (!choice) {
        return res.status(404).json({ message: "Choice not found" });
      }
      
      // Track if this was already owned for the response
      let alreadyPurchased = false;
      
      // Check if this is a premium choice and handle payment/access
      if (choice.isPremium && (choice.eggplantCost || 0) > 0) {
        // Check if user is authenticated for premium content
        if (!req.isAuthenticated()) {
          return res.status(401).json({ 
            message: "Login required for premium choices",
            requiresAuth: true,
            isPremium: true,
            eggplantCost: choice.eggplantCost || 0
          });
        }

        const userId = (req as any).user.claims.sub;
        
        // Check if user has already purchased this premium path
        alreadyPurchased = await storage.hasPurchasedPremiumPath(userId, choiceId);
        

        
        if (!alreadyPurchased) {
          // User hasn't purchased this path yet, check if they have enough eggplants
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
          
          // Track purchase attempt with modular analytics
          analytics.track({
            type: 'purchase_attempt',
            userId,
            storyId,
            pageId: choice.fromPageId,
            choiceId,
            timestamp: new Date(),
            metadata: {
              eggplantCost: cost,
              userEggplantsBefore: userEggplants
            }
          });
          
          // Deduct eggplants and record the purchase
          await storage.updateUserEggplants(userId, userEggplants - cost);
          await storage.purchasePremiumPath({
            userId,
            storyId,
            choiceId,
            eggplantCost: cost
          });
        }
        // If already purchased, user can access it for free forever
      }
      
      // For page-based navigation, we don't need to fetch target nodes
      // The choice simply moves to the next page
      
      // Save user choice if authenticated
      if (req.isAuthenticated()) {
        const userId = (req as any).user.claims.sub;
        
        // Track choice made with modular analytics
        analytics.track({
          type: 'choice_made',
          userId,
          storyId,
          pageId: choice.fromPageId,
          choiceId,
          timestamp: new Date(),
          metadata: {
            isPremium: choice.isPremium,
            alreadyOwned: alreadyPurchased,
            targetPage: choice.targetPage || (currentPage + 1)
          }
        });
        
        await storage.saveUserChoice({
          userId,
          storyId,
          choiceId,
        });
        
        // Save reading progress (PAGE-BASED: We need to convert this to page navigation)
        // For now, this choice endpoint shouldn't directly save progress
        // Progress should only be saved through the page-based story reader
      }
      
      // For page-based stories, use the choice's target_page if available
      // If no targetPage, try to get it from the to_page_id's order, or fallback to current+1
      let targetPage = choice.targetPage;
      
      if (!targetPage && choice.toPageId) {
        // Try to get the target page order from the database
        try {
          const targetPageData = await storage.getStoryPage(choice.toPageId);
          if (targetPageData) {
            targetPage = targetPageData.order;
          }
        } catch (error) {
          // Silently fallback to next page if target page data unavailable
        }
      }
      
      // Final fallback
      if (!targetPage) {
        targetPage = currentPage + 1;
      }
      
      // Return info about whether this was already owned BEFORE the purchase
      const wasAlreadyOwned = choice.isPremium && req.isAuthenticated() ? alreadyPurchased : false;
      

      
      res.json({
        targetPage: targetPage,
        choice,
        success: true,
        alreadyOwned: wasAlreadyOwned
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
      
      // Get the starting page
      const startingPage = await storage.getStoryStartingPage(storyId);
      if (!startingPage) {
        return res.status(404).json({ message: "Story starting page not found" });
      }
      
      res.json({
        success: true,
        startingPage,
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
          currentPage: progress.currentPage,
          isBookmarked: !progress.isBookmarked,
        });
        res.json({ isBookmarked: updatedProgress.isBookmarked });
      } else {
        // Create new progress with bookmark
        const story = await storage.getStory(storyId);
        if (!story) {
          return res.status(404).json({ message: "Story not found" });
        }
        
        const startingPage = await storage.getFirstStoryPage(storyId);
        if (!startingPage) {
          return res.status(404).json({ message: "Starting page not found" });
        }
        
        const newProgress = await storage.saveReadingProgress({
          userId,
          storyId,
          currentPage: 1, // Start at first page
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

  app.get('/api/stories/:storyId/pages', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'mega-admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { storyId } = req.params;
      const nodes = await storage.getStoryPages(storyId);
      res.json(nodes);
    } catch (error) {
      console.error("Error fetching story pages:", error);
      res.status(500).json({ message: "Failed to fetch story pages" });
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
      });

      // Update story to set as draft (not published)
      await storage.updateStory(story.id, {
        isPublished: false,
        isFeatured: false,
      });

      // Create nodes and choices if pages exist
      if (pages && pages.length > 0) {
        const nodeMap: Record<string, string> = {};
        
        // First pass: create all nodes
        for (const page of pages) {
          const node = await storage.createStoryPage({
            storyId: story.id,
            title: page.title || `Page ${page.order}`,
            content: page.content || "",
            order: page.order,
            isStarting: page.order === 1,
          });
          nodeMap[page.id] = node.id;
        }

        // Second pass: create choices with PAGE-BASED targeting
        for (const page of pages) {
          if (page.choices && page.choices.length > 0) {
            for (let i = 0; i < page.choices.length; i++) {
              const choice = page.choices[i];
              if (choice.text.trim() && choice.targetPageId) {
                // Find target page number from the targetPageId
                const targetPage = pages.find((p: any) => p.id === choice.targetPageId);
                const targetPageNumber = targetPage ? targetPage.order : (page.order + 1);
                
                await storage.createStoryChoice({
                  fromPageId: nodeMap[page.id],
                  toPageId: nodeMap[choice.targetPageId] || nodeMap[page.id], // Fallback to same node
                  choiceText: choice.text,
                  order: i,
                  isPremium: choice.isPremium || false,
                  eggplantCost: choice.eggplantCost || 0,
                  targetPage: targetPageNumber, // CRITICAL: Add page-based targeting
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

  // Create new story (unified timeline-based route)
  app.post('/api/stories', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'mega-admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { title, description, imageUrl, spiceLevel, category, pages, isPublished, isFeatured } = req.body;
      
      // If pages are provided, use the new timeline creation method
      if (pages && pages.length > 0) {
        const story = await storage.createStoryFromTimeline({
          story: {
            title: title || "New Story",
            description: description || "Story description",
            imageUrl: imageUrl || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
            spiceLevel: spiceLevel || 1,
            category: category || "straight",
            isPublished: isPublished || false,
            isFeatured: isFeatured || false,
          },
          pages
        });
        res.json(story);
      } else {
        // Fallback to simple story creation (legacy)
        const story = await storage.createStory({
          title: title || "New Story",
          description: description || "Story description",
          imageUrl: imageUrl || "https://images.unsplash.com/photo-1506905925346-21bda4d32df4",
          spiceLevel: spiceLevel || 1,
          category: category || "straight",
        });
        res.json(story);
      }
    } catch (error) {
      console.error("Error creating story:", error);
      res.status(500).json({ message: "Failed to create story" });
    }
  });

  // REMOVED: Duplicate route - functionality moved to main /api/stories/draft route above

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
        const node = await storage.createStoryPage({
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
                fromPageId: nodeMap[page.id],
                toPageId: nodeMap[choice.targetPageId],
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

  app.post('/api/stories/:storyId/pages', isAuthenticated, async (req: any, res) => {
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

      const node = await storage.createStoryPage({
        storyId,
        title,
        content,
        order,
        isStarting,
      });

      res.status(201).json(node);
    } catch (error) {
      console.error("Error creating story page:", error);
      res.status(500).json({ message: "Failed to create story page" });
    }
  });

  app.put('/api/nodes/:pageId', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'mega-admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { pageId } = req.params;
      const updates = req.body;
      
      const node = await storage.updateStoryPage(pageId, updates);
      res.json(node);
    } catch (error) {
      console.error("Error updating story page:", error);
      res.status(500).json({ message: "Failed to update story page" });
    }
  });

  app.delete('/api/nodes/:pageId', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'mega-admin') {
        return res.status(403).json({ message: "Mega-admin access required" });
      }

      const { pageId } = req.params;
      await storage.deleteStoryPage(pageId);
      res.json({ message: "Story page deleted successfully" });
    } catch (error) {
      console.error("Error deleting story page:", error);
      res.status(500).json({ message: "Failed to delete story page" });
    }
  });

  app.post('/api/nodes/:fromPageId/choices', isAuthenticated, async (req: any, res) => {
    try {
      const currentUser = await storage.getUser(req.user.claims.sub);
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'mega-admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { fromPageId } = req.params;
      const { toPageId, choiceText, isPremium, eggplantCost } = req.body;
      
      if (!toPageId || !choiceText) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const choice = await storage.createStoryChoice({
        fromPageId,
        toPageId,
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
  app.post('/api/add-eggplants', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { packageId } = req.body;
      
      // Mock eggplant packages for demo (in production, these would come from database)
      const packages = [
        { id: "starter", eggplants: 50, price: 4.99 },
        { id: "premium", eggplants: 150, bonus: 25, price: 12.99 },
        { id: "deluxe", eggplants: 300, bonus: 75, price: 24.99 },
        { id: "vip", eggplants: "∞", price: 49.99 }
      ];
      
      const selectedPackage = packages.find(p => p.id === packageId);
      if (!selectedPackage) {
        return res.status(400).json({ message: "Invalid package" });
      }
      
      // For demo purposes, add eggplants directly (in production, this would be triggered by Stripe webhook)
      if (selectedPackage.eggplants === "∞") {
        // Set to 9999 for VIP package
        await storage.updateUserEggplants(userId, 9999);
      } else {
        const totalEggplants = (selectedPackage.eggplants as number) + (selectedPackage.bonus || 0);
        const user = await storage.getUser(userId);
        const currentEggplants = user?.eggplants || 0;
        await storage.updateUserEggplants(userId, currentEggplants + totalEggplants);
      }
      
      res.json({ success: true, message: "Eggplants added successfully" });
    } catch (error) {
      console.error("Error adding eggplants:", error);
      res.status(500).json({ message: "Failed to add eggplants" });
    }
  });

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
          // Eggplants added successfully
        } catch (error) {
          // Log error in production monitoring system
        }
      }
    }

    res.json({ received: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}