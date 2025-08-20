-- Database performance optimization indexes
-- Run these in your database console to improve query performance

-- User + Story compound index for reading progress queries (most critical)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reading_progress_user_story 
ON reading_progress (user_id, story_id);

-- Story category + published index for story listing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stories_category_published 
ON stories (category, is_published) WHERE is_published = true;

-- User choices timeline index for analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_choices_timeline 
ON user_choices (user_id, created_at DESC);

-- Premium paths user index for purchase verification
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_premium_paths_user 
ON purchased_premium_paths (user_id, choice_id);

-- Story pages order index for navigation
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_story_pages_order 
ON story_pages (story_id, "order");

-- Reading sessions active index for session management
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reading_sessions_active 
ON reading_sessions (user_id, is_active, start_time DESC) WHERE is_active = true;

-- Story choices from page index for choice loading
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_story_choices_from_page 
ON story_choices (from_page_id, "order");

-- User ending cards for collection queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_ending_cards_user 
ON user_ending_cards (user_id, unlocked_at DESC);

-- Session expiry index for cleanup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_expire 
ON sessions (expire) WHERE expire > NOW();

-- Update table statistics for query optimizer
ANALYZE;