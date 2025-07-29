import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface StoryNavigationProps {
  storyTitle: string;
  canGoBack: boolean;
  onGoBack: () => void;
  onContinue: () => void;
  showChoices: boolean;
  isStoryEnding?: boolean;
  onGoToFirstChoice?: () => void;
  onReadFromBeginning?: () => void;
}

export function StoryNavigation({ 
  storyTitle, 
  canGoBack, 
  onGoBack, 
  onContinue,
  showChoices,
  isStoryEnding = false,
  onGoToFirstChoice,
  onReadFromBeginning
}: StoryNavigationProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-kindle border-t border-dark-tertiary/30 z-40">
      <div className="flex items-center justify-center px-6 py-4 max-w-3xl mx-auto">
        {isStoryEnding ? (
          /* Story ending navigation */
          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="text-kindle hover:text-rose-gold"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Button>
            
            {onGoToFirstChoice && (
              <Button
                onClick={onGoToFirstChoice}
                className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90 font-semibold px-4 py-2"
              >
                Try Different Path
              </Button>
            )}
          </div>
        ) : (
          /* Regular story navigation */
          <div className="flex items-center space-x-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={onGoBack}
              disabled={!canGoBack}
              className="text-kindle hover:text-rose-gold disabled:opacity-30 disabled:hover:text-kindle"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            
            <div className="text-center min-w-[200px]">
              <h2 className="text-sm font-medium text-kindle-secondary truncate">
                {storyTitle}
              </h2>
              {onReadFromBeginning && (
                <button
                  onClick={onReadFromBeginning}
                  className="text-xs text-kindle-secondary hover:text-rose-gold underline mt-1"
                >
                  Read from beginning
                </button>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onContinue}
              disabled={showChoices}
              className="text-kindle hover:text-rose-gold disabled:opacity-30 disabled:hover:text-kindle"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}