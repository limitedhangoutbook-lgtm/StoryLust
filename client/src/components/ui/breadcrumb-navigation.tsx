/**
 * Breadcrumb Navigation - Visual path tracking and navigation
 * Part of Phase 2: Enhanced UX Components
 */

import { useState } from 'react';
import { ChevronRight, Home, Star, Crown, Bookmark, Clock, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Separator } from './separator';
import { Badge } from './badge';

interface BreadcrumbNode {
  pageNumber: number;
  title: string;
  visualState: 'visited' | 'current' | 'premium' | 'significant';
  clickable: boolean;
}

interface PathSummary {
  totalPages: number;
  premiumUnlocked: number;
  averageTension: number;
  timeSpent: number; // minutes
}

interface BranchOption {
  id: string;
  name: string;
  preview: string;
  difficulty: 'easy' | 'moderate' | 'challenging';
}

interface BreadcrumbNavigationProps {
  crumbs: BreadcrumbNode[];
  pathSummary: PathSummary;
  branchOptions: BranchOption[];
  onNavigate?: (pageNumber: number) => void;
  onSelectBranch?: (branchId: string) => void;
  className?: string;
  compact?: boolean;
}

export function BreadcrumbNavigation({
  crumbs,
  pathSummary,
  branchOptions,
  onNavigate,
  onSelectBranch,
  className,
  compact = false
}: BreadcrumbNavigationProps) {
  const [showBranches, setShowBranches] = useState(false);
  
  const getNodeIcon = (visualState: string) => {
    switch (visualState) {
      case 'premium': return <Crown className="w-3 h-3 text-amber-500" />;
      case 'significant': return <Star className="w-3 h-3 text-blue-500" />;
      case 'current': return <Bookmark className="w-3 h-3 text-rose-500" />;
      default: return null;
    }
  };

  const getNodeStyle = (visualState: string, clickable: boolean) => {
    const baseStyle = "text-sm transition-colors duration-200";
    
    if (!clickable) {
      return cn(baseStyle, "text-gray-400 dark:text-gray-500 cursor-default");
    }

    switch (visualState) {
      case 'current':
        return cn(baseStyle, "text-rose-600 dark:text-rose-400 font-medium");
      case 'premium':
        return cn(baseStyle, "text-amber-600 dark:text-amber-400 hover:text-amber-700");
      case 'significant':
        return cn(baseStyle, "text-blue-600 dark:text-blue-400 hover:text-blue-700");
      default:
        return cn(baseStyle, "text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100");
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      case 'challenging': return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  // Show last 5 crumbs in compact mode, or all in full mode
  const displayCrumbs = compact ? crumbs.slice(-5) : crumbs;
  const hasHiddenCrumbs = compact && crumbs.length > 5;

  return (
    <div className={cn('bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg', className)}>
      {/* Path Summary Header */}
      {!compact && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
              Your Journey
            </h3>
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{pathSummary.timeSpent}m</span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span>{pathSummary.averageTension}% tension</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-6 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-300">Pages: </span>
              <span className="font-medium">{pathSummary.totalPages}</span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-300">Premium: </span>
              <span className="font-medium text-amber-600 dark:text-amber-400">
                {pathSummary.premiumUnlocked}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumb Trail */}
      <div className="p-4">
        <nav className="flex items-center space-x-1 text-sm" aria-label="Breadcrumb">
          {/* Home icon */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate?.(1)}
            className="p-1 h-6 w-6"
          >
            <Home className="w-3 h-3" />
          </Button>

          {hasHiddenCrumbs && (
            <>
              <ChevronRight className="w-3 h-3 text-gray-400" />
              <span className="text-gray-400">...</span>
            </>
          )}

          {displayCrumbs.map((crumb, index) => (
            <div key={crumb.pageNumber} className="flex items-center space-x-1">
              <ChevronRight className="w-3 h-3 text-gray-400" />
              
              <div className="flex items-center space-x-1">
                {getNodeIcon(crumb.visualState)}
                
                {crumb.clickable ? (
                  <button
                    onClick={() => onNavigate?.(crumb.pageNumber)}
                    className={getNodeStyle(crumb.visualState, crumb.clickable)}
                  >
                    {crumb.title}
                  </button>
                ) : (
                  <span className={getNodeStyle(crumb.visualState, crumb.clickable)}>
                    {crumb.title}
                  </span>
                )}
              </div>
            </div>
          ))}
        </nav>

        {/* Branch Options */}
        {branchOptions.length > 0 && (
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBranches(!showBranches)}
              className="text-xs"
            >
              {showBranches ? 'Hide' : 'Show'} Alternative Paths ({branchOptions.length})
            </Button>

            {showBranches && (
              <div className="mt-3 space-y-2">
                {branchOptions.map((branch) => (
                  <div
                    key={branch.id}
                    className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">{branch.name}</span>
                      <Badge 
                        variant="secondary" 
                        className={cn('text-xs', getDifficultyColor(branch.difficulty))}
                      >
                        {branch.difficulty}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      {branch.preview}
                    </p>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onSelectBranch?.(branch.id)}
                      className="w-full text-xs"
                    >
                      Explore This Path
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Compact breadcrumb for mobile or sidebar use
 */
export function CompactBreadcrumb({
  crumbs,
  onNavigate,
  className
}: Pick<BreadcrumbNavigationProps, 'crumbs' | 'onNavigate' | 'className'>) {
  const currentPage = crumbs[crumbs.length - 1];
  const previousPage = crumbs[crumbs.length - 2];

  return (
    <div className={cn('flex items-center space-x-2 text-sm', className)}>
      {previousPage && (
        <>
          <button
            onClick={() => onNavigate?.(previousPage.pageNumber)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            {previousPage.title}
          </button>
          <ChevronRight className="w-3 h-3 text-gray-400" />
        </>
      )}
      
      <span className="font-medium text-gray-900 dark:text-gray-100">
        {currentPage?.title || 'Current Page'}
      </span>
      
      <div className="flex items-center space-x-1 ml-2">
        {currentPage && getNodeIcon(currentPage.visualState)}
        <span className="text-xs text-gray-500">
          Page {currentPage?.pageNumber || 1}
        </span>
      </div>
    </div>
  );

  function getNodeIcon(visualState: string) {
    switch (visualState) {
      case 'premium': return <Crown className="w-3 h-3 text-amber-500" />;
      case 'significant': return <Star className="w-3 h-3 text-blue-500" />;
      case 'current': return <Bookmark className="w-3 h-3 text-rose-500" />;
      default: return null;
    }
  }
}

/**
 * Progress indicator showing story completion
 */
interface ProgressIndicatorProps {
  currentPage: number;
  totalPages: number;
  significantMoments: number[];
  className?: string;
}

export function ProgressIndicator({
  currentPage,
  totalPages,
  significantMoments,
  className
}: ProgressIndicatorProps) {
  const progressPercent = (currentPage / totalPages) * 100;

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>Page {currentPage}</span>
        <span>{Math.round(progressPercent)}% complete</span>
      </div>
      
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 relative">
        <div
          className="bg-rose-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
        
        {/* Significant moment markers */}
        {significantMoments.map((pageNum) => (
          <div
            key={pageNum}
            className="absolute top-0 w-1 h-2 bg-blue-500 rounded-full"
            style={{ left: `${(pageNum / totalPages) * 100}%` }}
            title={`Significant moment at page ${pageNum}`}
          />
        ))}
      </div>
    </div>
  );
}