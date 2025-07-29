// Story Creation System - allows writers to create endless branching structures
// Based on the user's sketches showing choice nodes (circles) and ending nodes (squares)

import { storage } from "./storage";
import type { Story, StoryNode, StoryChoice } from "@shared/schema";

// Define creation types separately to avoid schema conflicts
interface InsertStory {
  id: string;
  title: string;
  description: string;
  spiceLevel: number;
  category: string;
  wordCount: number;
  featured: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface InsertStoryNode {
  id: string;
  storyId: string;
  title: string;
  content: string;
  nodeType: string;
  isPremium: boolean;
  order: number;
  createdAt: Date;
}

interface InsertStoryChoice {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  choiceText: string;
  order: number;
  isPremium: boolean;
  diamondCost: number;
  createdAt: Date;
}

export interface CreatedStoryData {
  id: string;
  title: string;
  description: string;
  spiceLevel: number;
  category: string;
  pages: CreatedPageData[];
}

export interface CreatedPageData {
  id: string;
  title: string;
  content: string;
  isEnding?: boolean;
  endingType?: string;
  choices?: CreatedChoiceData[];
}

export interface CreatedChoiceData {
  id: string;
  text: string;
  nextPageId: string;
  isPremium?: boolean;
  diamondCost?: number;
}

export class StoryCreationManager {
  async createStoryFromData(storyData: CreatedStoryData): Promise<string> {
    try {
      // 1. Create the main story record
      const storyRecord: InsertStory = {
        title: storyData.title,
        description: storyData.description,
        imageUrl: "/api/placeholder/400/300", // Default placeholder
        spiceLevel: storyData.spiceLevel,
        category: storyData.category,
        wordCount: this.calculateWordCount(storyData.pages),
        pathCount: this.calculatePathCount(storyData.pages),
        isFeatured: false,
        isPublished: true
      };

      const story = await storage.createStory(storyRecord);

      // 2. Create all story nodes/pages
      for (const page of storyData.pages) {
        const nodeRecord: InsertStoryNode = {
          id: page.id,
          storyId: story.id,
          title: page.title,
          content: page.content,
          nodeType: page.isEnding ? 'ending' : (page.choices && page.choices.length > 0 ? 'choice' : 'content'),
          isPremium: false, // Pages themselves aren't premium, choices are
          order: this.getPageOrder(page.id, storyData.pages),
          createdAt: new Date()
        };

        await storage.createStoryNode(nodeRecord);

        // 3. Create choices for choice nodes
        if (page.choices && page.choices.length > 0) {
          for (let i = 0; i < page.choices.length; i++) {
            const choice = page.choices[i];
            const choiceRecord: InsertStoryChoice = {
              id: choice.id,
              fromNodeId: page.id,
              toNodeId: choice.nextPageId,
              choiceText: choice.text,
              order: i + 1,
              isPremium: choice.isPremium || false,
              diamondCost: choice.diamondCost || 0,
              createdAt: new Date()
            };

            await storage.createStoryChoice(choiceRecord);
          }
        }
      }

      return story.id;
    } catch (error) {
      console.error("Error creating story:", error);
      throw new Error("Failed to create story");
    }
  }

  private calculateWordCount(pages: CreatedPageData[]): number {
    return pages.reduce((total, page) => {
      const wordCount = page.content.split(/\s+/).filter(word => word.length > 0).length;
      return total + wordCount;
    }, 0);
  }

  private calculatePathCount(pages: CreatedPageData[]): number {
    // Count total number of different paths through the story
    const endings = pages.filter(p => p.isEnding).length;
    return Math.max(endings, 1); // At least 1 path
  }

  private getPageOrder(pageId: string, pages: CreatedPageData[]): number {
    // Start page is always first
    if (pageId === 'start') return 1;
    
    // Others are ordered by creation
    const index = pages.findIndex(p => p.id === pageId);
    return index >= 0 ? index + 1 : 999;
  }

  // Validate story structure before creation
  validateStoryStructure(storyData: CreatedStoryData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check required fields
    if (!storyData.title?.trim()) {
      errors.push("Story title is required");
    }

    if (!storyData.description?.trim()) {
      errors.push("Story description is required");
    }

    if (!storyData.pages || storyData.pages.length === 0) {
      errors.push("Story must have at least one page");
    }

    // Check for start page
    const hasStartPage = storyData.pages.some(p => p.id === 'start');
    if (!hasStartPage) {
      errors.push("Story must have a 'start' page");
    }

    // Check all choice connections are valid
    for (const page of storyData.pages) {
      if (page.choices) {
        for (const choice of page.choices) {
          if (!choice.nextPageId) {
            errors.push(`Choice "${choice.text}" has no target page`);
          } else {
            const targetExists = storyData.pages.some(p => p.id === choice.nextPageId);
            if (!targetExists) {
              errors.push(`Choice "${choice.text}" targets non-existent page "${choice.nextPageId}"`);
            }
          }
        }
      }
    }

    // Check for orphaned pages (except start)
    const reachablePages = new Set(['start']);
    const checkReachability = (pageId: string) => {
      const page = storyData.pages.find(p => p.id === pageId);
      if (page?.choices) {
        for (const choice of page.choices) {
          if (!reachablePages.has(choice.nextPageId)) {
            reachablePages.add(choice.nextPageId);
            checkReachability(choice.nextPageId);
          }
        }
      }
    };
    checkReachability('start');

    for (const page of storyData.pages) {
      if (page.id !== 'start' && !reachablePages.has(page.id)) {
        errors.push(`Page "${page.title}" is not reachable from the story start`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  // Helper to create a simple linear story template
  createLinearStoryTemplate(title: string, description: string): CreatedStoryData {
    return {
      id: `story-${Date.now()}`,
      title,
      description,
      spiceLevel: 1,
      category: "straight",
      pages: [
        {
          id: "start",
          title: "Beginning",
          content: "Write your opening here...",
          choices: [
            {
              id: "choice-1",
              text: "Continue the story",
              nextPageId: "page-2",
              isPremium: false
            }
          ]
        },
        {
          id: "page-2",
          title: "The Choice",
          content: "Write your story content here...",
          choices: [
            {
              id: "choice-a",
              text: "Free path",
              nextPageId: "ending-1",
              isPremium: false
            },
            {
              id: "choice-b",
              text: "Premium path",
              nextPageId: "ending-2",
              isPremium: true,
              diamondCost: 5
            }
          ]
        },
        {
          id: "ending-1",
          title: "Free Ending",
          content: "Your free ending here...",
          isEnding: true,
          endingType: "free"
        },
        {
          id: "ending-2",
          title: "Premium Ending",
          content: "Your premium ending here...",
          isEnding: true,
          endingType: "premium"
        }
      ]
    };
  }
}

export const storyCreationManager = new StoryCreationManager();