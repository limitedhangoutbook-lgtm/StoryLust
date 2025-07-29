import type { Story, StoryNode, StoryChoice } from "@shared/schema";
import { branchingStories, type BranchingStoryDefinition, type BranchingNode } from "./branching-stories";

export interface StoryDefinition {
  story: Omit<Story, 'id' | 'createdAt' | 'updatedAt'>;
  pages: StoryPageDefinition[];
}

export interface StoryPageDefinition {
  id: string;
  title: string;
  content: string;
  isPremium?: boolean;
  isStarting?: boolean;
  choices?: ChoiceDefinition[];
  nextPage?: string; // For linear progression before choices
}

export interface ChoiceDefinition {
  id: string;
  text: string;
  nextNodeId: string;
  isPremium?: boolean;
  diamondCost?: number;
}

export class StoryManager {
  private stories: Map<string, StoryDefinition> = new Map();

  constructor() {
    this.loadBranchingStories();
  }

  // Add a new story to the system
  addStory(storyId: string, definition: StoryDefinition): void {
    this.stories.set(storyId, definition);
  }

  // Get all stories
  getAllStories(): Story[] {
    return Array.from(this.stories.entries()).map(([id, def]) => ({
      id,
      ...def.story,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  }

  // Get a specific story
  getStory(storyId: string): Story | undefined {
    const definition = this.stories.get(storyId);
    if (!definition) return undefined;

    return {
      id: storyId,
      ...definition.story,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Get a story page/node
  getStoryNode(nodeId: string): StoryNode | undefined {
    for (const [storyId, definition] of Array.from(this.stories.entries())) {
      const page = definition.pages.find((p: any) => p.id === nodeId);
      if (page) {
        return {
          id: page.id,
          storyId,
          title: page.title,
          content: page.content,
          isStarting: page.isStarting || false,
          order: definition.pages.indexOf(page) + 1,
          createdAt: new Date()
        };
      }
    }
    return undefined;
  }

  // Get starting node for a story
  getStartingNode(storyId: string): StoryNode | undefined {
    const definition = this.stories.get(storyId);
    if (!definition) return undefined;

    const startingPage = definition.pages.find(p => p.isStarting);
    if (!startingPage) return undefined;

    return {
      id: startingPage.id,
      storyId,
      title: startingPage.title,
      content: startingPage.content,
      isStarting: true,
      order: 1,
      createdAt: new Date()
    };
  }

  // Get choices for a story node
  getStoryChoices(nodeId: string): StoryChoice[] {
    for (const [storyId, definition] of Array.from(this.stories.entries())) {
      const page = definition.pages.find((p: any) => p.id === nodeId);
      if (page && page.choices) {
        return page.choices.map((choice: any, index: number) => ({
          id: choice.id,
          fromNodeId: nodeId,
          toNodeId: choice.nextNodeId,
          choiceText: choice.text,
          order: index + 1,
          isPremium: choice.isPremium || false,
          diamondCost: choice.diamondCost || 0,
          createdAt: new Date()
        }));
      }
    }
    return [];
  }

  // Get a specific choice
  getStoryChoice(choiceId: string): StoryChoice | undefined {
    for (const [storyId, definition] of Array.from(this.stories.entries())) {
      for (const page of definition.pages) {
        if (page.choices) {
          const choice = page.choices.find((c: any) => c.id === choiceId);
          if (choice) {
            return {
              id: choice.id,
              fromNodeId: page.id,
              toNodeId: choice.nextNodeId,
              choiceText: choice.text,
              order: 1,
              isPremium: choice.isPremium || false,
              diamondCost: choice.diamondCost || 0,
              createdAt: new Date()
            };
          }
        }
      }
    }
    return undefined;
  }

  // Get next page in linear progression
  getNextPage(storyId: string, currentPageId: string): StoryNode | undefined {
    const definition = this.stories.get(storyId);
    if (!definition) return undefined;

    const currentPage = definition.pages.find(p => p.id === currentPageId);
    if (!currentPage || !currentPage.nextPage) return undefined;

    return this.getStoryNode(currentPage.nextPage);
  }

  // Load branching stories
  private loadBranchingStories(): void {
    for (const branchingStory of branchingStories) {
      this.addBranchingStory(branchingStory);
    }
  }

  // Add branching story
  private addBranchingStory(branchingStory: BranchingStoryDefinition): void {
    const storyDefinition: StoryDefinition = {
      story: {
        title: branchingStory.title,
        description: branchingStory.description,
        imageUrl: undefined,
        spiceLevel: branchingStory.spiceLevel,
        category: branchingStory.category,
        wordCount: this.calculateWordCount(branchingStory.nodes),
        pathCount: this.calculatePathCount(branchingStory.nodes),
        isFeatured: branchingStory.id === "campus-encounter",
        isPublished: true
      },
      pages: branchingStory.nodes.map((node, index) => ({
        id: node.id,
        title: node.title,
        content: node.content,
        isPremium: node.isPremium || false,
        isStarting: index === 0,
        choices: node.choices?.map(choice => ({
          id: choice.id,
          text: choice.text,
          nextNodeId: choice.nextNodeId,
          isPremium: choice.isPremium || false,
          diamondCost: choice.diamondCost || 0
        })) || [],
        nextPage: this.findNextPage(branchingStory.nodes, node, index)
      }))
    };
    
    this.stories.set(branchingStory.id, storyDefinition);
  }

  private calculateWordCount(nodes: BranchingNode[]): number {
    return nodes.reduce((total, node) => total + node.content.split(' ').length, 0);
  }

  private calculatePathCount(nodes: BranchingNode[]): number {
    return nodes.filter(node => node.isEnding).length;
  }

  private findNextPage(nodes: BranchingNode[], currentNode: BranchingNode, index: number): string | undefined {
    // If this node has choices, it doesn't have a next page
    if (currentNode.choices && currentNode.choices.length > 0) return undefined;
    
    // If this is an ending, it doesn't have a next page
    if (currentNode.isEnding) return undefined;
    
    // For the first 5 nodes (linear progression), find the next node in sequence
    if (index < 4) {
      return nodes[index + 1]?.id;
    }
    
    return undefined;
  }
}

// Export a singleton instance
export const storyManager = new StoryManager();