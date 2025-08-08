// Shared interface definitions to eliminate redundancy across components

// UNIFIED PAGE-BASED SYSTEM - Single source of truth for all story creation
export interface StoryPage {
  id: string;
  title: string;
  content: string;
  order: number;
  pageType: "story" | "choice" | "chat";
  choices?: Choice[];
  timelineColumn?: number; // For visual timeline builder
  chatMessages?: ChatMessage[]; // For chat dialogue pages
}

export interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp?: string;
  isUser: boolean; // true for user messages (right side), false for other character (left side)
}

export interface Choice {
  id: string;
  text: string;
  isPremium: boolean;
  eggplantCost: number;
  targetPageId: string;
}

export interface StoryPageBubble {
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
  nextPageId: string;
  isPremium?: boolean;
  eggplantCost?: number;
}

export interface Connection {
  fromPageId: string;
  toPageId: string;
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