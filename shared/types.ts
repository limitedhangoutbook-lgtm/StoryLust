// Shared interface definitions to eliminate redundancy across components

// UNIFIED PAGE-BASED SYSTEM - Single source of truth for all story creation
export interface StoryPage {
  id: string;
  title: string;
  content: string;
  order: number;
  pageType: "story" | "choice";
  choices?: Choice[];
  timelineColumn?: number; // For visual timeline builder
}

export interface Choice {
  id: string;
  text: string;
  isPremium: boolean;
  eggplantCost: number;
  targetPageId: string;
}

export interface StoryNode {
  id: string;
  type: 'choice' | 'ending' | 'page';
  title: string;
  content: string;
  x: number;
  y: number;
  isPremium?: boolean;
  endingType?: string;
  choices?: StoryChoice[];
}

export interface StoryChoice {
  id: string;
  text: string;
  nextNodeId: string;
  isPremium?: boolean;
  eggplantCost?: number;
}

export interface Connection {
  fromNodeId: string;
  toNodeId: string;
  choiceId: string;
  isPremium?: boolean;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  spiceLevel: number;
  category: string;
  wordCount: number;
  pathCount: number;
  isFeatured: boolean;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

// Story creation payload for API - using unified types
export interface CreateStoryPayload {
  title: string;
  description: string;
  imageUrl: string;
  spiceLevel: number;
  category: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  pages: StoryPage[];
}