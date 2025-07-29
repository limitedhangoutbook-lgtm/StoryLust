import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, ArrowLeft, Bookmark, BookmarkCheck, Gem } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface StoryPage {
  id: string;
  title: string;
  content: string;
  choices?: StoryChoice[];
  isEnding?: boolean;
}

interface StoryChoice {
  id: string;
  text: string;
  nextPageId: string;
  isPremium?: boolean;
  diamondCost?: number;
}

interface UnifiedStoryReaderProps {
  storyId: string;
  onBack: () => void;
  onTypographySettings: () => void;
}

export function UnifiedStoryReader({ storyId, onBack, onTypographySettings }: UnifiedStoryReaderProps) {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentPageId, setCurrentPageId] = useState<string>("start");
  const [pageHistory, setPageHistory] = useState<string[]>([]);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // Touch gesture handling
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Fetch complete story structure
  const { data: storyData, isLoading } = useQuery({
    queryKey: ["/api/stories", storyId, "complete"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/stories/${storyId}/complete`);
      return response.json();
    },
    enabled: !!storyId,
  });

  const currentPage = storyData?.pages?.find((page: StoryPage) => page.id === currentPageId);

  // Choice selection mutation
  const selectChoiceMutation = useMutation({
    mutationFn: async ({ choiceId, nextPageId, isPremium, diamondCost }: {
      choiceId: string;
      nextPageId: string;
      isPremium?: boolean;
      diamondCost?: number;
    }) => {
      console.log('Making unified choice:', { choiceId, nextPageId, isPremium, diamondCost });
      
      // For premium choices, validate authentication and diamonds
      if (isPremium && !isAuthenticated) {
        throw new Error("Authentication required for premium choices");
      }
      
      if (isPremium && isAuthenticated && diamondCost) {
        const userDiamonds = (user as any)?.diamonds || 0;
        if (userDiamonds < diamondCost) {
          throw new Error(`Insufficient diamonds: need ${diamondCost}, have ${userDiamonds}`);
        }
      }

      // Submit choice to server
      const response = await apiRequest("POST", `/api/stories/${storyId}/choice`, {
        choiceId,
        currentPageId,
        nextPageId,
        isPremium: isPremium || false,
        diamondCost: diamondCost || 0,
      });
      
      return { nextPageId, response: await response.json() };
    },
    onSuccess: ({ nextPageId }) => {
      console.log('Choice successful, navigating to:', nextPageId);
      
      // Add current page to history
      setPageHistory(prev => [...prev, currentPageId]);
      
      // Navigate to next page
      setCurrentPageId(nextPageId);
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      toast({
        title: "Choice Made",
        description: "Continuing your story...",
      });
    },
    onError: (error) => {
      console.error('Choice error:', error);
      
      if (error.message.includes("Authentication required")) {
        toast({
          title: "Sign In Required",
          description: "Sign in to unlock premium story paths",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1000);
        return;
      }
      
      if (error.message.includes("Insufficient diamonds")) {
        toast({
          title: "Not Enough Diamonds",
          description: error.message,
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Error",
        description: "Failed to process your choice. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleChoiceSelect = (choice: StoryChoice) => {
    selectChoiceMutation.mutate({
      choiceId: choice.id,
      nextPageId: choice.nextPageId,
      isPremium: choice.isPremium,
      diamondCost: choice.diamondCost,
    });
  };

  const handleGoBack = () => {
    if (pageHistory.length > 0) {
      const previousPageId = pageHistory[pageHistory.length - 1];
      setPageHistory(prev => prev.slice(0, -1));
      setCurrentPageId(previousPageId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      onBack();
    }
  };

  const handleContinue = () => {
    // Auto-advance to next page if no choices
    if (currentPage && !currentPage.choices?.length && !currentPage.isEnding) {
      const nextPageId = getNextPageId(currentPageId);
      if (nextPageId) {
        setPageHistory(prev => [...prev, currentPageId]);
        setCurrentPageId(nextPageId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const getNextPageId = (pageId: string): string | null => {
    // Simple sequential progression for pages without choices
    const pageNumber = parseInt(pageId.replace('page-', '')) || 0;
    const nextPage = `page-${pageNumber + 1}`;
    return storyData?.pages?.find((p: StoryPage) => p.id === nextPage) ? nextPage : null;
  };

  // Touch gesture handling
  useEffect(() => {
    const mainElement = mainContentRef.current;
    if (!mainElement) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (currentPage?.choices?.length) return; // Don't allow swipes when choices are present
      
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || currentPage?.choices?.length) return;
      
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;
      
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50;
      const isFastEnough = deltaTime < 300;
      
      if (isHorizontalSwipe && isFastEnough) {
        if (deltaX > 0 && pageHistory.length > 0) {
          handleGoBack();
        } else if (deltaX < 0) {
          handleContinue();
        }
      }
      
      touchStartRef.current = null;
    };

    mainElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    mainElement.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      mainElement.removeEventListener('touchstart', handleTouchStart);
      mainElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentPage, pageHistory]);

  if (isLoading || !currentPage) {
    return (
      <div className="min-h-screen bg-kindle flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  const hasChoices = currentPage.choices && currentPage.choices.length > 0;

  return (
    <div className="min-h-screen bg-kindle text-kindle relative">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10 px-4 py-3">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleGoBack}
            className="text-kindle hover:text-kindle-secondary hover:bg-dark-secondary/30"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onTypographySettings}
              className="text-kindle hover:text-kindle-secondary hover:bg-dark-secondary/30"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Story Content */}
      <main 
        ref={mainContentRef}
        className={`pt-16 px-6 max-w-3xl mx-auto min-h-screen touch-manipulation select-none ${
          hasChoices ? 'pb-32' : 'pb-28'
        }`}
        style={{ touchAction: 'pan-y' }}
      >
        {/* Page Title */}
        <h1 className="text-kindle text-2xl font-bold mb-8 text-center">
          {currentPage.title}
        </h1>

        {/* Story Content */}
        <div className="kindle-text">
          {currentPage.content.split('\n\n').map((paragraph: string, index: number) => (
            <p key={index} className="kindle-paragraph mb-6">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Choices - Integrated with Story Text */}
        {hasChoices && (
          <div className="mt-8 mb-16">
            <div className="space-y-6">
              {currentPage.choices.map((choice: StoryChoice, index: number) => (
                <div key={choice.id} className="kindle-text">
                  <button
                    onClick={() => handleChoiceSelect(choice)}
                    disabled={selectChoiceMutation.isPending}
                    className={`w-full text-left transition-all duration-200 group ${
                      choice.isPremium 
                        ? 'hover:text-rose-gold' 
                        : 'hover:text-kindle-secondary'
                    }`}
                  >
                    <p className="kindle-paragraph relative pl-8">
                      <span className={`absolute left-0 top-0 font-bold ${
                        choice.isPremium ? 'text-rose-gold' : 'text-kindle-secondary'
                      }`}>
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span className="underline decoration-dotted decoration-1 underline-offset-4 group-hover:decoration-solid">
                        {choice.text}
                      </span>
                      {choice.isPremium && (
                        <span className="ml-3 inline-flex items-center gap-1.5 px-2 py-1 bg-rose-gold/15 text-rose-gold border border-rose-gold/30 rounded-full text-xs font-semibold">
                          <Gem className="w-3 h-3 fill-current" />
                          <span>{choice.diamondCost || 5} diamonds</span>
                        </span>
                      )}
                    </p>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Story Navigation - Elegant Swipe Interface */}
        {!hasChoices && !currentPage.isEnding && (
          <div className="fixed bottom-0 left-0 right-0 bg-dark-secondary/95 backdrop-blur-sm border-t border-dark-tertiary/30">
            <div className="flex items-center max-w-3xl mx-auto">
              {/* Left Arrow - Go Back */}
              <button 
                onClick={handleGoBack}
                disabled={pageHistory.length === 0}
                className="p-4 text-kindle-secondary hover:text-kindle transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* Center - Story Title and Swipe Hint */}
              <div className="flex-1 text-center py-4">
                <div className="text-sm font-medium text-kindle mb-1">
                  {storyData?.title || "Story"}
                </div>
                <div className="text-xs text-kindle-secondary/70 tracking-wider">
                  Swipe left to continue • Swipe right to go back
                </div>
              </div>
              
              {/* Right Arrow - Continue */}
              <button 
                onClick={handleContinue}
                className="p-4 text-kindle-secondary hover:text-kindle transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Story Complete */}
        {currentPage.isEnding && (
          <div className="text-center mt-12 p-8 bg-dark-secondary/50 rounded-xl border border-dark-tertiary/30">
            <h2 className="text-xl font-bold text-kindle mb-4">Story Complete</h2>
            <p className="text-kindle-secondary mb-6">You've reached the end of this story path!</p>
            <Button onClick={onBack}>
              Choose Another Story
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}