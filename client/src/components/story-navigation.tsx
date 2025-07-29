import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface StoryNavigationProps {
  storyTitle: string;
  canGoBack: boolean;
  onGoBack: () => void;
  onContinue: () => void;
  showChoices: boolean;
}

export function StoryNavigation({ 
  storyTitle, 
  canGoBack, 
  onGoBack, 
  onContinue,
  showChoices 
}: StoryNavigationProps) {
  const [, setLocation] = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-kindle-bg/95 backdrop-blur-sm border-t border-kindle-secondary/20 z-50">
      <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
        {/* Back to home button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/")}
          className="text-kindle-secondary hover:text-kindle p-2"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {/* Story title with navigation */}
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onGoBack}
            disabled={!canGoBack || showChoices}
            className="text-kindle-secondary hover:text-kindle p-2 disabled:opacity-30"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <div className="text-center min-w-[120px]">
            <h2 className="text-sm font-medium text-kindle truncate max-w-[120px]">
              {storyTitle}
            </h2>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onContinue}
            disabled={showChoices}
            className="text-kindle-secondary hover:text-kindle p-2 disabled:opacity-30"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* Empty space for symmetry */}
        <div className="w-9"></div>
      </div>
    </div>
  );
}