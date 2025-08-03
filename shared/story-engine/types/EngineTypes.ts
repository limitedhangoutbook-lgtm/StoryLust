// Story engine configuration and processing types
export interface EngineConfig {
  enableAnalytics: boolean;
  enableTensionMechanics: boolean;
  defaultChoiceDelay: number; // milliseconds
  maxChoicesPerPage: number;
}

export interface NavigationRequest {
  userId: string;
  storyId: string;
  choiceId?: string;
  targetPageId?: string;
}

export interface NavigationResult {
  success: boolean;
  session: any; // Will be typed as StorySession after import
  error?: string;
  analyticsEvent?: AnalyticsEvent;
}

export interface AnalyticsEvent {
  type: 'page_view' | 'choice_made' | 'purchase_attempt' | 'story_completed';
  userId: string;
  storyId: string;
  pageId: string;
  choiceId?: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface TensionMetrics {
  anticipationLevel: number; // 0-100
  regretFactor: number; // 0-100  
  satisfactionScore: number; // 0-100
  purchaseUrgency: number; // 0-100
}

// Re-export story types for convenience
export type {
  StoryPage,
  StoryChoice, 
  StoryMetadata,
  UserProgress,
  ChoiceEvaluation,
  StorySession
} from './StoryTypes';