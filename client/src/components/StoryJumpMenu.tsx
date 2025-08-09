import React, { useState } from 'react';
import { MoreHorizontal, Navigation, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuery } from '@tanstack/react-query';

interface JumpMenuProps {
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

interface MapChoice {
  id: string;
  fromPageId: string;
  toPageId: string;
  text: string;
  isPremium: boolean;
  isOwned: boolean;
  eggplantCost: number;
  targetPage: number;
}

interface StoryMapData {
  storyId: string;
  pageBubbles: MapPageBubble[];
  choices: MapChoice[];
}

export default function StoryJumpMenu({ storyId, currentPage, onNavigateToPage }: JumpMenuProps) {
  const { data: mapData } = useQuery<StoryMapData>({
    queryKey: [`/api/stories/${storyId}/map`],
    enabled: !!storyId,
  });

  if (!mapData?.pageBubbles) return null;

  // Get unlocked pages (accessible from current reading progress)
  const unlockedPages = mapData.pageBubbles.filter(page => 
    page.pageNumber <= currentPage || page.isOwned
  );

  // Get premium locked pages
  const lockedPages = mapData.pageBubbles.filter(page => 
    page.isPremium && !page.isOwned
  );

  const handlePageJump = (pageNumber: number) => {
    onNavigateToPage(pageNumber);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="bg-white/80 backdrop-blur-sm border-purple-200 hover:bg-purple-50 dark:bg-gray-800/80 dark:border-purple-700 dark:hover:bg-purple-900/50"
        >
          <MoreHorizontal className="w-4 h-4 mr-2" />
          Jump to Page
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Navigation className="w-4 h-4 text-purple-600" />
          Story Navigation
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Unlocked Pages */}
        {unlockedPages.map((page) => (
          <DropdownMenuItem
            key={page.id}
            onClick={() => handlePageJump(page.pageNumber)}
            className={`cursor-pointer ${
              page.pageNumber === currentPage 
                ? 'bg-purple-100 dark:bg-purple-900/50 font-semibold' 
                : ''
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {page.type === 'choice' ? '🔄' : page.type === 'ending' ? '🏁' : '📖'}
                </span>
                <span className="font-medium">{page.title}</span>
              </div>
              <span className="text-xs text-gray-400 ml-2">
                P.{page.pageNumber}
              </span>
            </div>
          </DropdownMenuItem>
        ))}

        {/* Premium Locked Pages */}
        {lockedPages.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-gray-500">
              Premium Content
            </DropdownMenuLabel>
            {lockedPages.map((page) => {
              const choice = mapData.choices.find(c => c.toPageId === page.id);
              const cost = choice?.eggplantCost || 15;
              
              return (
                <DropdownMenuItem
                  key={page.id}
                  disabled
                  className="opacity-60 cursor-not-allowed"
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Lock className="w-3 h-3 text-amber-500" />
                      <span>Locked Path</span>
                    </div>
                    <span className="text-xs text-amber-600">
                      {cost}🍆
                    </span>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}