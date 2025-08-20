// Define types for story layout generation
interface StoryMapData {
  pageBubbles: Array<{
    id: string;
    pageNumber: number;
    title: string;
    type: 'story' | 'ending';
    isPremium: boolean;
    isOwned: boolean;
    x: number;
    y: number;
    connections: string[];
  }>;
  choices: Array<{
    id: string;
    fromPageId: string;
    toPageId: string | null;
    text: string;
    isPremium: boolean;
    isOwned: boolean;
    eggplantCost: number;
    targetPage: number;
  }>;
}

interface MermaidPage {
  id: string;
  label: string;
  type: 'page' | 'ending' | 'premium';
  pageNumber: number;
}

interface MermaidEdge {
  from: string;
  to: string;
  label?: string;
  style: 'normal' | 'premium';
}

export class StoryLayoutGenerator {
  /**
   * Generate Mermaid.js flowchart definition from story data
   */
  generateMermaidDefinition(storyData: StoryMapData): string {
    const pages = this.extractPages(storyData.pageBubbles);
    const edges = this.extractEdges(storyData.choices);
    
    let mermaidCode = 'flowchart TD\n';
    
    // Add page definitions with styling
    pages.forEach(page => {
      const style = this.getPageStyle(page);
      const icon = this.getPageIcon(page);
      mermaidCode += `    ${page.id}["${icon} Page ${page.pageNumber}<br/>${page.label}"]:::${style}\n`;
    });
    
    mermaidCode += '\n';
    
    // Add edge connections
    edges.forEach(edge => {
      if (edge.style === 'premium') {
        mermaidCode += `    ${edge.from} -.->|"🍆 Premium"| ${edge.to}\n`;
      } else {
        mermaidCode += `    ${edge.from} --> ${edge.to}\n`;
      }
    });
    
    mermaidCode += '\n';
    mermaidCode += this.getStyleDefinitions();
    
    return mermaidCode;
  }

  /**
   * Generate optimized layout positions using graph algorithms
   */
  generateOptimizedLayout(storyData: StoryMapData): StoryMapData {
    // Create a hierarchical layout based on story flow
    const levels = this.calculatePageLevels(storyData);
    const positioned = this.positionPagesInLevels(storyData.pageBubbles, levels);
    
    return {
      ...storyData,
      pageBubbles: positioned
    };
  }

  private extractPages(pages: any[]): MermaidPage[] {
    return pages.map((page: any) => ({
      id: `page${page.pageNumber}`,
      label: page.title.split(' ').slice(0, 2).join(' '),
      type: page.type === 'ending' ? 'ending' : (page.isPremium ? 'premium' : 'page'),
      pageNumber: page.pageNumber
    }));
  }

  private extractEdges(choices: any[]): MermaidEdge[] {
    return choices
      .filter((choice: any) => choice.toPageId)
      .map((choice: any) => ({
        from: `page${choice.fromPageId.replace(/[^0-9]/g, '')}`,
        to: `page${choice.toPageId!.replace(/[^0-9]/g, '')}`,
        label: choice.isPremium ? `🍆 ${choice.eggplantCost}` : undefined,
        style: choice.isPremium ? 'premium' : 'normal'
      }));
  }

  private getPageStyle(page: MermaidPage): string {
    switch (page.type) {
      case 'ending': return 'ending';
      case 'premium': return 'premium';
      default: return 'normal';
    }
  }

  private getPageIcon(page: MermaidPage): string {
    switch (page.type) {
      case 'ending': return '🎯';
      case 'premium': return '🍆';
      default: return '📖';
    }
  }

  private getStyleDefinitions(): string {
    return `
    classDef normal fill:#ffffff,stroke:#e5e7eb,stroke-width:2px,color:#1f2937
    classDef premium fill:#faf7ff,stroke:#a855f7,stroke-width:2px,color:#7c3aed
    classDef ending fill:#fff7ed,stroke:#f59e0b,stroke-width:2px,color:#d97706
    `;
  }

  private calculatePageLevels(storyData: StoryMapData): Map<string, number> {
    const levels = new Map<string, number>();
    const visited = new Set<string>();
    
    // Find starting pages (no incoming edges)
    const incomingCount = new Map<string, number>();
    storyData.choices.forEach(choice => {
      if (choice.toPageId) {
        incomingCount.set(choice.toPageId, (incomingCount.get(choice.toPageId) || 0) + 1);
      }
    });
    
    const startPages = storyData.pageBubbles
      .filter((page: any) => !incomingCount.has(page.id))
      .map((page: any) => page.id);
    
    // BFS to assign levels
    const queue: Array<{id: string, level: number}> = startPages.map(id => ({id, level: 0}));
    
    while (queue.length > 0) {
      const {id, level} = queue.shift()!;
      
      if (visited.has(id)) continue;
      visited.add(id);
      levels.set(id, level);
      
      // Add children to queue
      const children = storyData.choices
        .filter(choice => choice.fromPageId === id && choice.toPageId)
        .map(choice => choice.toPageId!);
      
      children.forEach(childId => {
        if (!visited.has(childId)) {
          queue.push({id: childId, level: level + 1});
        }
      });
    }
    
    return levels;
  }

  private positionPagesInLevels(pages: any[], levels: Map<string, number>): any[] {
    const levelPages = new Map<number, any[]>();
    
    // Group pages by level
    pages.forEach((page: any) => {
      const level = levels.get(page.id) || 0;
      if (!levelPages.has(level)) {
        levelPages.set(level, []);
      }
      levelPages.get(level)!.push(page);
    });
    
    // Position pages within each level
    const positioned: any[] = [];
    levelPages.forEach((levelPageList, level) => {
      const yPos = level * 2; // Vertical spacing
      levelPageList.forEach((page: any, index: number) => {
        const xPos = (index - levelPageList.length / 2) * 2; // Center horizontally
        positioned.push({
          ...page,
          x: xPos,
          y: yPos
        });
      });
    });
    
    return positioned;
  }
}

export const storyLayoutGenerator = new StoryLayoutGenerator();