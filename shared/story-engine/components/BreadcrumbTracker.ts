/**
 * Breadcrumb Tracker - Visual navigation and path history
 * Part of Phase 2: Enhanced UX Components
 */

export interface BreadcrumbNode {
  pageNumber: number;
  title: string;
  choiceMade?: string;
  timestamp: number;
  isPremium: boolean;
  tensionLevel: number;
  isBookmarked?: boolean;
  wasSignificant: boolean; // Major plot points or character moments
}

export interface PathBranch {
  id: string;
  nodes: BreadcrumbNode[];
  totalPages: number;
  premiumChoices: number;
  averageTension: number;
  completedAt?: number;
  bookmarkCount: number;
}

export interface NavigationState {
  currentPath: BreadcrumbNode[];
  availableBranches: PathBranch[];
  significantMoments: BreadcrumbNode[];
  recentBookmarks: BreadcrumbNode[];
  pathEfficiency: number; // 0-100, how direct the path was
}

export class BreadcrumbTracker {
  private navigationState: NavigationState;
  private config: {
    maxPathLength: number;
    maxBranches: number;
    significanceThreshold: number;
  };

  constructor() {
    this.navigationState = {
      currentPath: [],
      availableBranches: [],
      significantMoments: [],
      recentBookmarks: [],
      pathEfficiency: 100
    };

    this.config = {
      maxPathLength: 100,
      maxBranches: 10,
      significanceThreshold: 70 // Tension level that marks significance
    };
  }

  /**
   * Add a new page to the current path
   */
  addPage(pageData: {
    pageNumber: number;
    title: string;
    choiceMade?: string;
    isPremium: boolean;
    tensionLevel: number;
    isBookmarked?: boolean;
  }): NavigationState {
    const node: BreadcrumbNode = {
      ...pageData,
      timestamp: Date.now(),
      wasSignificant: pageData.tensionLevel >= this.config.significanceThreshold
    };

    // Add to current path
    this.navigationState.currentPath.push(node);

    // Limit path length
    if (this.navigationState.currentPath.length > this.config.maxPathLength) {
      this.navigationState.currentPath = this.navigationState.currentPath.slice(-this.config.maxPathLength);
    }

    // Track significant moments
    if (node.wasSignificant) {
      this.navigationState.significantMoments.push(node);
      this.navigationState.significantMoments = this.navigationState.significantMoments.slice(-20); // Keep last 20
    }

    // Track bookmarks
    if (node.isBookmarked) {
      this.navigationState.recentBookmarks.unshift(node);
      this.navigationState.recentBookmarks = this.navigationState.recentBookmarks.slice(0, 10); // Keep top 10
    }

    // Update path efficiency
    this.updatePathEfficiency();

    return { ...this.navigationState };
  }

  /**
   * Create a new branch when user backtracks and makes different choice
   */
  createBranch(fromPageNumber: number, branchName?: string): string {
    const branchPoint = this.navigationState.currentPath.findIndex(
      node => node.pageNumber === fromPageNumber
    );

    if (branchPoint === -1) return '';

    // Create branch from the divergence point
    const branchNodes = this.navigationState.currentPath.slice(0, branchPoint + 1);
    const branchId = `branch-${Date.now()}`;

    const branch: PathBranch = {
      id: branchId,
      nodes: branchNodes,
      totalPages: branchNodes.length,
      premiumChoices: branchNodes.filter(node => node.isPremium).length,
      averageTension: this.calculateAverageTension(branchNodes),
      bookmarkCount: branchNodes.filter(node => node.isBookmarked).length
    };

    // Add to available branches
    this.navigationState.availableBranches.push(branch);

    // Limit number of branches
    if (this.navigationState.availableBranches.length > this.config.maxBranches) {
      this.navigationState.availableBranches = this.navigationState.availableBranches.slice(-this.config.maxBranches);
    }

    // Update current path to continue from branch point
    this.navigationState.currentPath = branchNodes;

    return branchId;
  }

  /**
   * Get visual breadcrumb data for UI
   */
  getBreadcrumbDisplay(): {
    crumbs: {
      pageNumber: number;
      title: string;
      visualState: 'visited' | 'current' | 'premium' | 'significant';
      clickable: boolean;
    }[];
    pathSummary: {
      totalPages: number;
      premiumUnlocked: number;
      averageTension: number;
      timeSpent: number; // minutes
    };
    branchOptions: {
      id: string;
      name: string;
      preview: string;
      difficulty: 'easy' | 'moderate' | 'challenging';
    }[];
  } {
    const currentPath = this.navigationState.currentPath;
    const now = Date.now();

    // Create breadcrumbs with visual states
    const crumbs = currentPath.map((node, index) => {
      let visualState: 'visited' | 'current' | 'premium' | 'significant';
      
      if (index === currentPath.length - 1) {
        visualState = 'current';
      } else if (node.isPremium) {
        visualState = 'premium';
      } else if (node.wasSignificant) {
        visualState = 'significant';
      } else {
        visualState = 'visited';
      }

      return {
        pageNumber: node.pageNumber,
        title: node.title,
        visualState,
        clickable: index < currentPath.length - 1 // Can go back to previous pages
      };
    });

    // Calculate path summary
    const pathSummary = {
      totalPages: currentPath.length,
      premiumUnlocked: currentPath.filter(node => node.isPremium).length,
      averageTension: this.calculateAverageTension(currentPath),
      timeSpent: currentPath.length > 0 
        ? Math.round((now - currentPath[0].timestamp) / 60000) 
        : 0
    };

    // Create branch options
    const branchOptions = this.navigationState.availableBranches.map(branch => {
      const difficulty = this.calculateBranchDifficulty(branch);
      const preview = this.generateBranchPreview(branch);
      
      return {
        id: branch.id,
        name: `Path ${branch.nodes.length} pages`,
        preview,
        difficulty
      };
    });

    return { crumbs, pathSummary, branchOptions };
  }

  /**
   * Get significant moments for story recap
   */
  getSignificantMoments(): {
    moments: {
      pageNumber: number;
      title: string;
      description: string;
      tensionLevel: number;
      relativeTime: string;
    }[];
    storyArc: {
      risingAction: number[];
      climaxes: number[];
      resolutions: number[];
    };
  } {
    const moments = this.navigationState.significantMoments.map(node => ({
      pageNumber: node.pageNumber,
      title: node.title,
      description: node.choiceMade || 'Significant story moment',
      tensionLevel: node.tensionLevel,
      relativeTime: this.formatRelativeTime(node.timestamp)
    }));

    // Analyze story arc
    const storyArc = this.analyzeStoryArc();

    return { moments, storyArc };
  }

  /**
   * Jump to a specific page in the path
   */
  jumpToPage(pageNumber: number): boolean {
    const targetIndex = this.navigationState.currentPath.findIndex(
      node => node.pageNumber === pageNumber
    );

    if (targetIndex === -1) return false;

    // Create branch if jumping backward significantly
    if (targetIndex < this.navigationState.currentPath.length - 5) {
      this.createBranch(pageNumber, `Jump back to page ${pageNumber}`);
    }

    return true;
  }

  /**
   * Get reading progress insights
   */
  getProgressInsights(): {
    readingSpeed: 'fast' | 'normal' | 'slow';
    engagementLevel: 'high' | 'medium' | 'low';
    preferredPacing: 'action' | 'romance' | 'mystery' | 'balanced';
    recommendations: string[];
  } {
    const currentPath = this.navigationState.currentPath;
    if (currentPath.length < 5) {
      return {
        readingSpeed: 'normal',
        engagementLevel: 'medium',
        preferredPacing: 'balanced',
        recommendations: ['Continue reading to get personalized insights']
      };
    }

    // Calculate reading speed
    const avgTimePerPage = this.calculateAverageTimePerPage();
    const readingSpeed = avgTimePerPage < 30000 ? 'fast' : avgTimePerPage > 120000 ? 'slow' : 'normal';

    // Calculate engagement
    const bookmarkRate = this.navigationState.recentBookmarks.length / currentPath.length;
    const engagementLevel = bookmarkRate > 0.2 ? 'high' : bookmarkRate > 0.1 ? 'medium' : 'low';

    // Determine preferred pacing
    const preferredPacing = this.determinePreferredPacing();

    // Generate recommendations
    const recommendations = this.generateRecommendations(readingSpeed, engagementLevel, preferredPacing);

    return { readingSpeed, engagementLevel, preferredPacing, recommendations };
  }

  // Private helper methods
  private updatePathEfficiency(): void {
    const currentPath = this.navigationState.currentPath;
    if (currentPath.length < 2) return;

    const totalPages = currentPath.length;
    const uniquePages = new Set(currentPath.map(node => node.pageNumber)).size;
    
    this.navigationState.pathEfficiency = Math.round((uniquePages / totalPages) * 100);
  }

  private calculateAverageTension(nodes: BreadcrumbNode[]): number {
    if (nodes.length === 0) return 0;
    const sum = nodes.reduce((acc, node) => acc + node.tensionLevel, 0);
    return Math.round(sum / nodes.length);
  }

  private calculateBranchDifficulty(branch: PathBranch): 'easy' | 'moderate' | 'challenging' {
    const premiumRatio = branch.premiumChoices / branch.totalPages;
    const tensionLevel = branch.averageTension;

    if (premiumRatio > 0.3 || tensionLevel > 80) return 'challenging';
    if (premiumRatio > 0.1 || tensionLevel > 60) return 'moderate';
    return 'easy';
  }

  private generateBranchPreview(branch: PathBranch): string {
    const lastNode = branch.nodes[branch.nodes.length - 1];
    return `${branch.totalPages} pages, ${branch.premiumChoices} premium choices. Last: "${lastNode.title}"`;
  }

  private analyzeStoryArc(): {
    risingAction: number[];
    climaxes: number[];
    resolutions: number[];
  } {
    const path = this.navigationState.currentPath;
    const risingAction: number[] = [];
    const climaxes: number[] = [];
    const resolutions: number[] = [];

    for (let i = 1; i < path.length; i++) {
      const current = path[i];
      const previous = path[i - 1];
      
      if (current.tensionLevel > previous.tensionLevel + 10) {
        risingAction.push(current.pageNumber);
      } else if (current.tensionLevel > 80) {
        climaxes.push(current.pageNumber);
      } else if (current.tensionLevel < previous.tensionLevel - 15) {
        resolutions.push(current.pageNumber);
      }
    }

    return { risingAction, climaxes, resolutions };
  }

  private formatRelativeTime(timestamp: number): string {
    const minutes = Math.floor((Date.now() - timestamp) / 60000);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hours ago`;
    const days = Math.floor(hours / 24);
    return `${days} days ago`;
  }

  private calculateAverageTimePerPage(): number {
    const path = this.navigationState.currentPath;
    if (path.length < 2) return 60000; // Default 1 minute

    const totalTime = path[path.length - 1].timestamp - path[0].timestamp;
    return totalTime / (path.length - 1);
  }

  private determinePreferredPacing(): 'action' | 'romance' | 'mystery' | 'balanced' {
    // Simple heuristic based on tension patterns
    const avgTension = this.calculateAverageTension(this.navigationState.currentPath);
    const tensionVariance = this.calculateTensionVariance();

    if (avgTension > 70) return 'action';
    if (tensionVariance < 10) return 'romance';
    if (tensionVariance > 30) return 'mystery';
    return 'balanced';
  }

  private calculateTensionVariance(): number {
    const path = this.navigationState.currentPath;
    if (path.length < 3) return 15; // Default moderate variance

    const avgTension = this.calculateAverageTension(path);
    const variance = path.reduce((acc, node) => {
      return acc + Math.pow(node.tensionLevel - avgTension, 2);
    }, 0) / path.length;

    return Math.sqrt(variance);
  }

  private generateRecommendations(
    speed: 'fast' | 'normal' | 'slow',
    engagement: 'high' | 'medium' | 'low',
    pacing: 'action' | 'romance' | 'mystery' | 'balanced'
  ): string[] {
    const recommendations: string[] = [];

    if (speed === 'fast' && engagement === 'high') {
      recommendations.push('You\'re racing through! Consider slowing down to savor the details');
    }

    if (speed === 'slow' && engagement === 'low') {
      recommendations.push('Try skipping to choice points if the current section feels slow');
    }

    if (pacing === 'action') {
      recommendations.push('You enjoy high-tension moments - look for stories with adventure tags');
    }

    if (this.navigationState.recentBookmarks.length > 3) {
      recommendations.push('You bookmark frequently - perfect for complex branching stories');
    }

    if (recommendations.length === 0) {
      recommendations.push('Keep exploring - your reading pattern looks great!');
    }

    return recommendations;
  }

  /**
   * Reset tracking for new story
   */
  reset(): void {
    this.navigationState = {
      currentPath: [],
      availableBranches: [],
      significantMoments: [],
      recentBookmarks: [],
      pathEfficiency: 100
    };
  }

  /**
   * Get full navigation state for analytics
   */
  getNavigationState(): NavigationState {
    return { ...this.navigationState };
  }
}

// Export singleton instance
export const breadcrumbTracker = new BreadcrumbTracker();