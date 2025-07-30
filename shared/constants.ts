// Application constants to avoid magic numbers and hard-coded values

export const EGGPLANT_CONFIG = {
  // Starting eggplants for different user types
  DEFAULT_STARTING_EGGPLANTS: 20,
  MEGA_ADMIN_EGGPLANTS: 999,
  
  // Package amounts
  STARTER_PACK: 100,
  BEST_VALUE_PACK: 300,
  VIP_PACK: 9999,
  
  // Prices (in USD cents)
  STARTER_PRICE: 299, // $2.99
  BEST_VALUE_PRICE: 499, // $4.99
  VIP_PRICE: 4999, // $49.99
} as const;

export const STORY_CONFIG = {
  // Default node identifiers
  DEFAULT_START_NODE: "start",
  
  // Content markers
  STORY_END_MARKER: "**THE END**",
  
  // Reading session settings
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
  PROGRESS_CACHE_TIME: 5 * 60 * 1000, // 5 minutes
} as const;

export const UI_CONFIG = {
  // Touch gesture thresholds
  SWIPE_THRESHOLD: 30, // pixels
  SWIPE_TIMEOUT: 500, // milliseconds
  
  // Animation durations
  TOAST_DURATION: 2000,
  CHOICE_FEEDBACK_DURATION: 1500,
  
  // Navigation timeouts
  NAVIGATION_HIDE_DELAY: 3000,
  
  // Reading milestones
  STORIES_EXPLORER_TARGET: 10,
  CHOICE_MASTER_TARGET: 100,
  READING_TIME_TARGET: 1000, // minutes
} as const;