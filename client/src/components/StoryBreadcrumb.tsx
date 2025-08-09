import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface BreadcrumbProps {
  storyId: string;
  currentPage: number;
  onNavigateToPage: (pageNumber: number) => void;
}

interface MapPageBubble {
  id: string;
  type: 'page' | 'choice' | 'ending';
  pageNumber: number;
  title: string;
  isPremium: boolean;
  isOwned: boolean;
  x: number;
  y: number;
  connections: string[];
}

interface StoryMapData {
  storyId: string;
  pageBubbles: MapPageBubble[];
  choices: any[];
}

export default function StoryBreadcrumb({ storyId, currentPage, onNavigateToPage }: BreadcrumbProps) {
  const { data: mapData } = useQuery<StoryMapData>({
    queryKey: [`/api/stories/${storyId}/map`],
    enabled: !!storyId,
  });

  if (!mapData?.pageBubbles) return null;

  // Build breadcrumb trail (simplified - shows recent pages)
  const recentPages = mapData.pageBubbles
    .filter(page => page.pageNumber <= currentPage)
    .sort((a, b) => a.pageNumber - b.pageNumber)
    .slice(-4); // Show last 4 pages for space

  const handleCrumbClick = (pageNumber: number) => {
    onNavigateToPage(pageNumber);
  };

  return (
    <div className="flex items-center gap-1 text-sm bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 border border-purple-200 dark:bg-gray-800/80 dark:border-purple-700">
      {recentPages.map((page, index) => (
        <React.Fragment key={page.id}>
          <button
            onClick={() => handleCrumbClick(page.pageNumber)}
            className={`
              px-2 py-1 rounded-md transition-colors cursor-pointer
              ${page.pageNumber === currentPage 
                ? 'bg-purple-100 text-purple-800 font-semibold dark:bg-purple-900/50 dark:text-purple-200' 
                : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
              }
            `}
          >
            {page.title}
            {page.isPremium && !page.isOwned && (
              <span className="ml-1 text-amber-600">🍆</span>
            )}
          </button>
          {index < recentPages.length - 1 && (
            <ChevronRight className="w-3 h-3 text-gray-400" />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}