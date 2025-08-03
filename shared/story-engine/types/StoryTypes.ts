// Core story engine types - isolated from database schema
export interface StoryPage {
  id: string;
  storyId: string;
  pageNumber: number;
  content: string;
  isEnding: boolean;
}

export interface StoryChoice {
  id: string;
  fromPageId: string;
  toPageId: string;
  choiceText: string;
  isPremium: boolean;
  eggplantCost: number;
  description?: string;
}

export interface StoryMetadata {
  id: string;
  title: string;
  description: string;
  category: string;
  spiceLevel: number;
  totalPages: number;
  author: string;
  coverImage?: string;
}

export interface UserProgress {
  userId: string;
  storyId: string;
  currentPageId: string;
  completedPages: string[];
  purchasedChoices: string[];
  lastReadAt: Date;
}

export interface ChoiceEvaluation {
  choice: StoryChoice;
  isAccessible: boolean;
  requiresPurchase: boolean;
  reason?: string;
}

export interface StorySession {
  storyId: string;
  currentPage: StoryPage;
  availableChoices: ChoiceEvaluation[];
  progress: UserProgress;
  metadata: StoryMetadata;
}