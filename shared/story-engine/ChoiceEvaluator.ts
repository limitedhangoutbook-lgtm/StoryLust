import type { 
  StoryChoice, 
  UserProgress, 
  ChoiceEvaluation,
  TensionMetrics 
} from './types/EngineTypes';

export class ChoiceEvaluator {
  /**
   * Evaluates whether a user can access specific story choices
   * Handles premium content logic and purchase validation
   */
  static evaluateChoices(
    choices: StoryChoice[],
    userProgress: UserProgress,
    userEggplants: number
  ): ChoiceEvaluation[] {
    return choices.map(choice => this.evaluateChoice(choice, userProgress, userEggplants));
  }

  private static evaluateChoice(
    choice: StoryChoice,
    userProgress: UserProgress,
    userEggplants: number
  ): ChoiceEvaluation {
    // Free choice - always accessible
    if (!choice.isPremium) {
      return {
        choice,
        isAccessible: true,
        requiresPurchase: false
      };
    }

    // Premium choice - check if already purchased
    const alreadyPurchased = userProgress.purchasedChoices.includes(choice.id);
    if (alreadyPurchased) {
      return {
        choice,
        isAccessible: true,
        requiresPurchase: false,
        reason: 'Previously purchased'
      };
    }

    // Premium choice - check if user can afford it
    const canAfford = userEggplants >= choice.eggplantCost;
    return {
      choice,
      isAccessible: canAfford,
      requiresPurchase: true,
      reason: canAfford ? `Costs ${choice.eggplantCost} eggplants` : 'Insufficient eggplants'
    };
  }

  /**
   * Calculates tension metrics based on choice availability and user behavior
   * Used for enhanced UX and conversion optimization
   */
  static calculateTensionMetrics(
    evaluations: ChoiceEvaluation[],
    userProgress: UserProgress
  ): TensionMetrics {
    const premiumChoices = evaluations.filter(e => e.choice.isPremium);
    const accessiblePremium = premiumChoices.filter(e => e.isAccessible);
    const unaffordablePremium = premiumChoices.filter(e => !e.isAccessible && e.requiresPurchase);

    // Calculate anticipation based on available premium content
    const anticipationLevel = Math.min(100, accessiblePremium.length * 30);

    // Calculate regret factor based on unaffordable choices
    const regretFactor = Math.min(100, unaffordablePremium.length * 25);

    // Calculate satisfaction based on story progress
    const progressRatio = userProgress.completedPages.length / 10; // Assuming average story length
    const satisfactionScore = Math.min(100, progressRatio * 60);

    // Calculate purchase urgency based on choice scarcity
    const totalPremium = premiumChoices.length;
    const purchaseUrgency = totalPremium > 0 ? 
      Math.min(100, (unaffordablePremium.length / totalPremium) * 80) : 0;

    return {
      anticipationLevel,
      regretFactor,
      satisfactionScore,
      purchaseUrgency
    };
  }
}