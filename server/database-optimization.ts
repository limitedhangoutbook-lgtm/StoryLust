import { sql } from "drizzle-orm";
import { db } from "./db";

// Database optimization and indexing
export class DatabaseOptimizer {
  
  // Create performance indexes
  async createPerformanceIndexes() {
    try {
      // User + Story compound index for reading progress queries
      await db.execute(sql`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reading_progress_user_story 
        ON reading_progress (user_id, story_id);
      `);

      // Story category + published index for story listing
      await db.execute(sql`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stories_category_published 
        ON stories (category, is_published) WHERE is_published = true;
      `);

      // User choices timeline index
      await db.execute(sql`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_choices_timeline 
        ON user_choices (user_id, created_at DESC);
      `);

      // Premium paths user index
      await db.execute(sql`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_premium_paths_user 
        ON purchased_premium_paths (user_id, choice_id);
      `);

      // Story pages order index
      await db.execute(sql`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_story_pages_order 
        ON story_pages (story_id, "order");
      `);

      // Reading sessions active index
      await db.execute(sql`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reading_sessions_active 
        ON reading_sessions (user_id, is_active, start_time DESC) WHERE is_active = true;
      `);

      console.log('Performance indexes created successfully');
    } catch (error) {
      console.error('Error creating indexes:', error);
    }
  }

  // Analyze query performance
  async analyzeQueryPerformance(query: string) {
    const result = await db.execute(sql`EXPLAIN ANALYZE ${sql.raw(query)}`);
    return result;
  }

  // Clean up old data to maintain performance
  async performMaintenance() {
    try {
      // Archive old reading sessions (older than 90 days)
      await db.execute(sql`
        UPDATE reading_sessions 
        SET is_active = false 
        WHERE created_at < NOW() - INTERVAL '90 days' AND is_active = true;
      `);

      // Clean up expired sessions
      await db.execute(sql`
        DELETE FROM sessions 
        WHERE expire < NOW();
      `);

      // Update statistics for query optimizer
      await db.execute(sql`ANALYZE;`);

      console.log('Database maintenance completed');
    } catch (error) {
      console.error('Error during maintenance:', error);
    }
  }

  // Monitor slow queries
  async getSlowQueries() {
    const result = await db.execute(sql`
      SELECT query, calls, total_time, mean_time, rows
      FROM pg_stat_statements 
      WHERE mean_time > 100 
      ORDER BY mean_time DESC 
      LIMIT 10;
    `);
    return result;
  }
}

export const dbOptimizer = new DatabaseOptimizer();