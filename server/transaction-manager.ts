import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { users, purchasedPremiumPaths, userChoices, readingProgress } from "@shared/schema";

export interface PremiumChoiceTransaction {
  userId: string;
  storyId: string;
  choiceId: string;
  eggplantCost: number;
  pageId: string;
}

export class TransactionManager {
  
  // Atomic premium choice purchase with rollback capability
  async purchasePremiumChoice(transaction: PremiumChoiceTransaction): Promise<{
    success: boolean;
    error?: string;
    newEggplantBalance?: number;
  }> {
    return await db.transaction(async (tx) => {
      try {
        // 1. Get current user data with row locking
        const [user] = await tx
          .select()
          .from(users)
          .where(eq(users.id, transaction.userId))
          .for('update'); // Row-level lock to prevent race conditions

        if (!user) {
          throw new Error('User not found');
        }

        // 2. Check if user has sufficient eggplants
        if (user.eggplants < transaction.eggplantCost) {
          throw new Error('Insufficient eggplants');
        }

        // 3. Check if choice is already purchased
        const [existingPurchase] = await tx
          .select()
          .from(purchasedPremiumPaths)
          .where(
            and(
              eq(purchasedPremiumPaths.userId, transaction.userId),
              eq(purchasedPremiumPaths.choiceId, transaction.choiceId)
            )
          );

        if (existingPurchase) {
          throw new Error('Choice already purchased');
        }

        // 4. Deduct eggplants
        const newBalance = user.eggplants - transaction.eggplantCost;
        await tx
          .update(users)
          .set({ 
            eggplants: newBalance,
            updatedAt: new Date()
          })
          .where(eq(users.id, transaction.userId));

        // 5. Record the purchase
        await tx.insert(purchasedPremiumPaths).values({
          userId: transaction.userId,
          storyId: transaction.storyId,
          choiceId: transaction.choiceId,
          eggplantCost: transaction.eggplantCost
        });

        // 6. Record the choice in user history
        await tx.insert(userChoices).values({
          userId: transaction.userId,
          storyId: transaction.storyId,
          choiceId: transaction.choiceId
        });

        return {
          success: true,
          newEggplantBalance: newBalance
        };

      } catch (error) {
        // Transaction will automatically rollback
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });
  }

  // Atomic reading progress update
  async updateReadingProgress(
    userId: string, 
    storyId: string, 
    pageNumber: number,
    additionalData?: {
      isCompleted?: boolean;
      readingTimeMinutes?: number;
      choicesMade?: number;
    }
  ): Promise<{ success: boolean; error?: string }> {
    return await db.transaction(async (tx) => {
      try {
        // Check if progress exists
        const [existingProgress] = await tx
          .select()
          .from(readingProgress)
          .where(
            and(
              eq(readingProgress.userId, userId),
              eq(readingProgress.storyId, storyId)
            )
          )
          .for('update');

        const updateData = {
          currentPage: pageNumber,
          lastReadAt: new Date(),
          pagesRead: Math.max(existingProgress?.pagesRead || 0, pageNumber),
          ...(additionalData?.isCompleted && { 
            isCompleted: true, 
            completedAt: new Date() 
          }),
          ...(additionalData?.readingTimeMinutes && {
            totalReadingTimeMinutes: (existingProgress?.totalReadingTimeMinutes || 0) + additionalData.readingTimeMinutes
          }),
          ...(additionalData?.choicesMade && {
            choicesMade: (existingProgress?.choicesMade || 0) + additionalData.choicesMade
          })
        };

        if (existingProgress) {
          await tx
            .update(readingProgress)
            .set(updateData)
            .where(
              and(
                eq(readingProgress.userId, userId),
                eq(readingProgress.storyId, storyId)
              )
            );
        } else {
          await tx.insert(readingProgress).values({
            userId,
            storyId,
            ...updateData
          });
        }

        return { success: true };

      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to update reading progress'
        };
      }
    });
  }

  // Batch operations for performance
  async batchUpdateUserChoices(choices: Array<{
    userId: string;
    storyId: string;
    choiceId: string;
  }>): Promise<{ success: boolean; error?: string }> {
    return await db.transaction(async (tx) => {
      try {
        await tx.insert(userChoices).values(choices);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Batch operation failed'
        };
      }
    });
  }
}

export const transactionManager = new TransactionManager();