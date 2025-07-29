import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Gem, Heart, Settings } from "lucide-react";
import { StoryNavigation } from "@/components/story-navigation";
import { TypographySettings } from "@/components/typography-settings";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Story, StoryNode, StoryChoice } from "@shared/schema";

export default function StoryReader() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/story/:storyId");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  const [pageHistory, setPageHistory] = useState<string[]>([]);
  const [showTypographySettings, setShowTypographySettings] = useState(false);
  
  // Touch gesture handling
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);

  const storyId = params?.storyId;

  // Fetch story details
  const { data: story, isLoading: storyLoading } = useQuery<Story>({
    queryKey: ["/api/stories", storyId],
    enabled: !!storyId,
  });

  // Fetch current node
  const { data: currentNode, isLoading: nodeLoading } = useQuery<StoryNode>({
    queryKey: ["/api/nodes", currentNodeId],
    enabled: !!currentNodeId,
  });

  // Fetch choices for current node
  const { data: choices = [] } = useQuery<StoryChoice[]>({
    queryKey: ["/api/nodes", currentNodeId, "choices"],
    enabled: !!currentNodeId,
  });

  // Initialize story on load
  useEffect(() => {
    if (!storyId || currentNodeId) return;

    // Always start from the beginning for guests, or get progress for authenticated users
    if (isAuthenticated) {
      queryClient.fetchQuery({
        queryKey: ["/api/reading-progress", storyId],
      }).then((progress: any) => {
        if (progress?.currentNodeId) {
          setCurrentNodeId(progress.currentNodeId);
          setIsBookmarked(!!progress.isBookmarked);
        } else {
          // Start from beginning
          fetchStartingNode();
        }
      }).catch(() => {
        // If no progress found, start from beginning
        fetchStartingNode();
      });
    } else {
      fetchStartingNode();
    }

    function fetchStartingNode() {
      queryClient.fetchQuery({
        queryKey: ["/api/stories", storyId, "start"],
      }).then((startingNode: any) => {
        if (startingNode) {
          setCurrentNodeId(startingNode.id);
        }
      }).catch((error) => {
        console.error('Error fetching starting node:', error);
        toast({
          title: "Error",
          description: "Failed to load story. Please try again.",
          variant: "destructive",
        });
      });
    }
  }, [storyId, isAuthenticated, currentNodeId, queryClient, toast]);

  // Update choices visibility when they're available
  useEffect(() => {
    setShowChoices(choices.length > 0);
  }, [choices]);

  // Go back handler  
  const handleGoBack = () => {
    if (pageHistory.length > 0) {
      const previousNodeId = pageHistory[pageHistory.length - 1];
      setPageHistory(prev => prev.slice(0, -1));
      setCurrentNodeId(previousNodeId);
      setShowChoices(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Add touch event listeners for swipe gestures
  useEffect(() => {
    const mainElement = mainContentRef.current;
    if (!mainElement) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || e.changedTouches.length !== 1) return;
      
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;
      
      // Only handle swipes that are primarily horizontal and fast enough
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50;
      const isFastEnough = deltaTime < 300;
      
      if (isHorizontalSwipe && isFastEnough && !showChoices) {
        if (deltaX > 0 && pageHistory.length > 0) {
          // Swipe right - go back
          handleGoBack();
        } else if (deltaX < 0) {
          // Swipe left - continue reading
          handleContinueReading();
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
  }, [showChoices, currentNodeId, pageHistory]);

  const selectChoiceMutation = useMutation({
    mutationFn: async (choiceId: string) => {
      const response = await apiRequest("POST", `/api/reading-progress/choice`, {
        storyId,
        currentNodeId,
        choiceId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.nextNodeId) {
        // Add current page to history before navigating
        if (currentNodeId) {
          setPageHistory(prev => [...prev, currentNodeId]);
        }
        
        setCurrentNodeId(data.nextNodeId);
        setShowChoices(false);
        
        // Scroll to top for new content
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/nodes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reading-progress"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Error",
        description: "Failed to process your choice. Please try again.",
        variant: "destructive",
      });
    },
  });

  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      if (!isAuthenticated) throw new Error("Not authenticated");
      
      const response = await apiRequest("POST", `/api/reading-progress/bookmark`, {
        storyId,
        currentNodeId,
        isBookmarked: !isBookmarked,
      });
      return response.json();
    },
    onSuccess: () => {
      setIsBookmarked(!isBookmarked);
      toast({
        title: isBookmarked ? "Bookmark Removed" : "Story Bookmarked",
        description: isBookmarked ? "Removed from your reading list" : "Added to your reading list",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      
      toast({
        title: "Error",
        description: "Failed to bookmark story",
        variant: "destructive",
      });
    },
  });

  const handleChoiceSelect = (choiceId: string, isPremium?: boolean, diamondCost?: number) => {
    if (!isAuthenticated && isPremium) {
      toast({
        title: "Sign In Required",
        description: "Sign in to unlock premium story paths with diamonds",
        variant: "destructive",
      });
      return;
    }

    const userDiamonds = (user as any)?.diamonds || 0;
    
    if (isPremium && (diamondCost || 0) > userDiamonds) {
      toast({
        title: "Not Enough Diamonds",
        description: `You need ${diamondCost || 0} diamonds to unlock this choice. Visit the store to get more!`,
        variant: "destructive",
      });
      return;
    }

    selectChoiceMutation.mutate(choiceId);
  };

  const handleContinueReading = async () => {
    if (choices.length > 0) {
      // This page has choices, show them
      setShowChoices(true);
    } else {
      // This page doesn't have choices, try to get next page from server
      try {
        const nextNodeResponse = await apiRequest("GET", `/api/stories/${storyId}/next/${currentNodeId}`);
        const nextNode = await nextNodeResponse.json();
        if (nextNode && nextNode.id) {
          // Add current page to history before navigating
          if (currentNodeId) {
            setPageHistory(prev => [...prev, currentNodeId]);
          }
          
          setCurrentNodeId(nextNode.id);
          
          // Reset choices state for new page
          setShowChoices(false);
          
          // Scroll to top for new page
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          // Story ended
          toast({
            title: "Story Complete",
            description: "You've reached the end of this story path!",
          });
        }
      } catch (error) {
        console.error('Error fetching next page:', error);
        toast({
          title: "Error",
          description: "Failed to load next page. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const getNextPageId = (currentId: string | null): string | null => {
    if (!currentId || !storyId) return null;
    
    // For branching stories, page progression is handled by the story manager
    // This function is now simplified - the story manager knows the next page
    return null; // Let the story manager handle page progression
  };

  const getNavigationText = (currentId: string | null, hasChoices: boolean): string | null => {
    if (hasChoices) return null; // Choices replace navigation
    
    // For the first page (start), show "Start Reading"
    if (currentId === "start") {
      return "Start Reading";
    }
    
    const nextPageId = getNextPageId(currentId);
    if (nextPageId) {
      return "Continue Reading";
    }
    
    return "Story Complete";
  };

  const handleBookmark = () => {
    if (!isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to bookmark stories",
        variant: "destructive",
      });
      return;
    }
    bookmarkMutation.mutate();
  };

  const userDiamonds = (user as any)?.diamonds || 0;

  if (!match) {
    return null;
  }

  // Show loading state while critical data is loading OR while data doesn't exist yet
  if (storyLoading || nodeLoading || (!story && storyId) || (!currentNode && currentNodeId)) {
    return (
      <div className="min-h-screen kindle-reader flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-rose-gold border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-kindle-secondary">Loading story...</p>
        </div>
      </div>
    );
  }

  // Only show error state if we definitively failed to load
  if (storyId && !storyLoading && !story) {
    return (
      <div className="min-h-screen kindle-reader flex items-center justify-center text-center px-4">
        <div>
          <h2 className="text-xl font-semibold text-kindle mb-2">Story not found</h2>
          <Button 
            onClick={() => setLocation("/")}
            className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90"
          >
            Back to Stories
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen kindle-reader">
      {/* Minimal Header - Just back button and diamonds */}
      <header className="absolute top-0 left-0 right-0 z-10 px-4 py-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="text-kindle-secondary hover:text-kindle p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          {isAuthenticated && (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 px-3 py-1 bg-dark-secondary/50 rounded-full">
                <Gem className="w-4 h-4 text-rose-gold" />
                <span className="text-sm font-medium text-kindle">{userDiamonds}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowTypographySettings(true)}
                className="text-kindle-secondary hover:text-kindle"
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmark}
                className={isBookmarked ? "text-rose-gold" : "text-kindle-secondary hover:text-kindle"}
                disabled={bookmarkMutation.isPending || false}
              >
                <Heart className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`} />
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Story Content - Full screen like Kindle */}
      <main ref={mainContentRef} className="pt-16 pb-20 px-6 max-w-3xl mx-auto">
        {/* Swipe hint for first time users */}
        {currentNodeId === "start" && (
          <div className="text-center mb-4 text-kindle-secondary text-sm">
            💡 Tip: Swipe left to continue, swipe right to go back
          </div>
        )}
        
        {/* Story Text */}
        <div className="kindle-text text-kindle space-y-0">
          {currentNode?.content.split('\n\n').map((paragraph, index) => (
            <p key={index} className="kindle-paragraph">
              {paragraph}
            </p>
          ))}
        </div>
      </main>



      {/* Story Navigation - Clean and Simple */}
      {!showChoices && (
        <StoryNavigation
          storyTitle={story?.title || ""}
          canGoBack={pageHistory.length > 0}
          onGoBack={handleGoBack}
          onContinue={handleContinueReading}
          showChoices={showChoices}
        />
      )}

      {/* Choices overlay when available */}
      {showChoices && choices.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-kindle border-t border-dark-tertiary/30 px-6 py-4 z-50">
          <div className="max-w-3xl mx-auto">
            <div className="space-y-3">
              <p className="text-center text-kindle-secondary text-sm mb-4">
                Choose your path:
              </p>
              {choices.map((choice) => (
                <button
                  key={choice.id}
                  onClick={() => handleChoiceSelect(choice.id, choice.isPremium, choice.diamondCost)}
                  disabled={selectChoiceMutation.isPending || false}
                  className="w-full p-3 text-left text-kindle bg-dark-secondary/30 hover:bg-dark-secondary/50 transition-colors border border-dark-tertiary/50 hover:border-rose-gold/30 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">
                      {choice.choiceText}
                    </span>
                    {choice.isPremium && (
                      <div className="flex items-center gap-1 text-rose-gold">
                        <Gem className="w-3 h-3" />
                        <span className="text-xs">{choice.diamondCost}</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Typography Settings Modal */}
      <TypographySettings
        isOpen={showTypographySettings}
        onClose={() => setShowTypographySettings(false)}
      />
    </div>
  );
}