import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Home } from "lucide-react";

export default function StoryReaderPages() {
  const [match, params] = useRoute("/story/:storyId");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Page-based state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  
  const storyId = params?.storyId;

  // Get story
  const { data: story } = useQuery<{ id: string; title: string }>({
    queryKey: [`/api/stories/${storyId}`],
    enabled: !!storyId,
  });

  // Get all pages for this story ordered sequentially  
  const { data: allPages = [] } = useQuery<Array<{ 
    id: string; 
    storyId: string; 
    title: string; 
    content: string; 
    order: number;
    nextNodeId?: string;
  }>>({
    queryKey: [`/api/stories/${storyId}/pages`],
    enabled: !!storyId,
  });

  // Get choices for current page - use array index since pages might not have sequential order values
  const currentNode = allPages[currentPage - 1]; // Convert 1-based page to 0-based index
  const { data: choices = [] } = useQuery<Array<{ 
    id: string; 
    choiceText: string; 
    isPremium: boolean; 
    eggplantCost?: number;
    toNodeId: string;
  }>>({
    queryKey: [`/api/nodes/${currentNode?.id}/choices`],
    enabled: !!currentNode?.id,
  });

  // Get progress
  const { data: progress } = useQuery<{ currentNodeId?: string }>({
    queryKey: [`/api/reading-progress/${storyId}`],
    enabled: !!storyId && isAuthenticated,
  });

  // Set total pages when data loads
  useEffect(() => {
    if (allPages.length > 0) {
      setTotalPages(allPages.length);
      
      // Find current page from progress or start at page 1
      if (progress?.currentNodeId) {
        const pageIndex = allPages.findIndex(page => page.id === progress.currentNodeId);
        if (pageIndex !== -1) {
          setCurrentPage(pageIndex + 1); // Convert 0-based index to 1-based page
        }
      } else {
        // Check localStorage for guests
        const savedPage = localStorage.getItem(`story-${storyId}-page`);
        if (savedPage) {
          const savedPageNum = parseInt(savedPage);
          // Ensure saved page is within valid range
          if (savedPageNum >= 1 && savedPageNum <= allPages.length) {
            setCurrentPage(savedPageNum);
          } else {
            setCurrentPage(1); // Reset to first page if invalid
          }
        }
      }
    }
  }, [allPages, progress, storyId]);

  // Simple swipe handling for page navigation
  useEffect(() => {
    let startX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const deltaX = endX - startX;
      
      if (Math.abs(deltaX) > 100) {
        if (deltaX > 0 && currentPage > 1) {
          // Swipe right - go back
          goToPreviousPage();
        } else if (deltaX < 0 && choices.length === 0 && currentPage < totalPages) {
          // Swipe left - go forward (only if no choices)
          goToNextPage();
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentPage, totalPages, choices.length]);

  // Navigation functions
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage);
      saveProgress(newPage);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage);
      saveProgress(newPage);
    }
  };

  const saveProgress = (pageNumber: number) => {
    // Use array index instead of page.order for consistency
    const page = allPages[pageNumber - 1]; // Convert 1-based to 0-based index
    if (!page || !storyId) return;

    // Save locally
    localStorage.setItem(`story-${storyId}-page`, pageNumber.toString());
    
    // Save to server if authenticated
    if (isAuthenticated) {
      apiRequest("POST", "/api/reading-progress", {
        storyId,
        currentNodeId: page.id,
        isBookmarked: false,
      }).catch(() => {});
    }
  };

  // Handle choice click with authentication check
  const handleChoiceClick = (choice: any) => {
    // Check if this is a premium choice and user is not authenticated
    if (choice.isPremium && !isAuthenticated) {
      toast({
        title: "Premium Content",
        description: "Sign in to unlock premium story paths and get 20 free eggplants!",
        action: (
          <div className="flex gap-2">
            <button
              onClick={() => window.location.href = "/api/login"}
              className="bg-rose-gold text-dark-primary px-3 py-1 rounded text-sm font-semibold"
            >
              Sign In
            </button>
          </div>
        ),
        duration: 8000,
      });
      return;
    }
    
    // Proceed with regular choice selection
    selectChoiceMutation.mutate(choice.id);
  };

  // Select choice - navigate to target page
  const selectChoiceMutation = useMutation({
    mutationFn: async (choiceId: string) => {
      const response = await apiRequest("POST", `/api/choices/${choiceId}/select`, {
        storyId,
        currentNodeId: currentNode?.id,
      });
      return response.json();
    },
    onSuccess: (data, choiceId) => {
      if (data.targetNode?.id) {
        // Find the page index for the target node (convert to 1-based page number)
        const targetPageIndex = allPages.findIndex(page => page.id === data.targetNode.id);
        if (targetPageIndex !== -1) {
          const targetPageNumber = targetPageIndex + 1;
          setCurrentPage(targetPageNumber);
          saveProgress(targetPageNumber);
        }
        
        // Show feedback
        const choice = choices.find(c => c.id === choiceId);
        toast({
          title: choice?.isPremium ? "🍆✨ Premium Choice Made! ✨🍆" : "✨ Choice Made! ✨",
          description: "Your story continues...",
          duration: 1500,
        });
        
        // Refresh user data if this was a premium choice to update eggplant count
        if (choice?.isPremium) {
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        }
        
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    onError: (error: any) => {
      if (error.message?.includes("401") || error.message?.includes("Login required")) {
        toast({
          title: "Login Required",
          description: "You need to login to access premium content.",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 1500);
      } else if (error.message?.includes("Not enough eggplants")) {
        toast({
          title: "Not Enough Eggplants",
          description: "You need more eggplants to unlock this premium choice.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to make choice",
          variant: "destructive",
        });
      }
    },
  });

  // Reset story
  const resetMutation = useMutation({
    mutationFn: async () => {
      // Call the proper start-from-beginning endpoint
      await apiRequest("POST", `/api/stories/${storyId}/start-from-beginning`);
      localStorage.removeItem(`story-${storyId}-page`);
    },
    onSuccess: () => {
      setCurrentPage(1);
      queryClient.invalidateQueries({ queryKey: [`/api/reading-progress/${storyId}`] });
      // Also refresh story pages to ensure we get the correct starting position
      queryClient.invalidateQueries({ queryKey: [`/api/stories/${storyId}/pages`] });
    },
  });

  // Check if story is ending
  const isEnding = currentNode?.content?.includes("**THE END**") || false;

  if (!story || !currentNode || allPages.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-kindle">
        <div className="animate-spin w-8 h-8 border-4 border-rose-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kindle text-kindle">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-kindle/95 backdrop-blur-sm border-b border-dark-tertiary/30 z-50">
        <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="text-kindle-secondary hover:text-kindle p-2 sm:px-3"
          >
            <ChevronLeft className="w-5 h-5 sm:mr-2" />
            <span className="hidden sm:inline">Home</span>
          </Button>
          
          <h1 className="text-base sm:text-lg font-semibold text-kindle truncate max-w-[120px] sm:max-w-xs">
            {story.title}
          </h1>
          
          <div className="text-xs sm:text-sm text-kindle-secondary">
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16 sm:pt-20 px-4 sm:px-6 max-w-3xl mx-auto pb-32">
        {/* Page Progress Bar */}
        <div className="mb-6">
          <div className="w-full bg-dark-tertiary rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-rose-gold to-gold-accent h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentPage / totalPages) * 100}%` }}
            />
          </div>
          <div className="text-center mt-2 text-sm text-kindle-secondary">
          </div>
        </div>
        
        {/* Story Content */}
        <div className="kindle-text text-kindle space-y-4 sm:space-y-6 mb-8">
          <h2 className="text-lg sm:text-xl font-bold text-kindle mb-3 sm:mb-4">{currentNode.title}</h2>
          {currentNode.content.split('\n\n').map((paragraph, index) => (
            <p key={index} className="kindle-paragraph leading-relaxed text-sm sm:text-base">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Choices */}
        {choices.length > 0 && !isEnding && (
          <div className="space-y-3 sm:space-y-4 mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-kindle mb-3 sm:mb-4">What do you do?</h3>
            {choices.map((choice, index) => (
              <button
                key={choice.id}
                onClick={() => handleChoiceClick(choice)}
                disabled={selectChoiceMutation.isPending}
                className={`w-full text-left p-3 sm:p-4 rounded-lg border transition-all ${
                  choice.isPremium 
                    ? 'border-rose-gold/30 hover:border-rose-gold hover:bg-rose-gold/5' 
                    : 'border-dark-tertiary hover:border-kindle-secondary hover:bg-dark-secondary/30'
                }`}
              >
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <span className={`font-bold text-base sm:text-lg ${choice.isPremium ? 'text-rose-gold' : 'text-kindle-secondary'}`}>
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <div className="flex-1">
                    <span className="text-sm sm:text-base">
                      {choice.choiceText}
                    </span>
                    {choice.isPremium && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 bg-rose-gold/15 text-rose-gold border border-rose-gold/30 rounded-full text-xs sm:text-sm font-semibold">
                        <span>🍆</span>
                        <span>{choice.eggplantCost || 0} eggplants</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Story Ending */}
        {isEnding && (
          <div className="text-center space-y-8 mt-12">
            <div className="text-6xl font-bold text-rose-gold mb-6">THE END</div>
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-rose-gold to-transparent mx-auto mb-8" />
            
            <div className="space-y-4 max-w-md mx-auto">
              <Button
                onClick={() => setLocation("/")}
                className="w-full bg-gradient-to-r from-rose-gold to-gold-accent text-dark-primary font-bold py-4 text-lg"
              >
                <Home className="w-5 h-5 mr-2" />
                Back to Stories
              </Button>
              
              <Button
                onClick={() => resetMutation.mutate()}
                disabled={resetMutation.isPending}
                variant="outline"
                className="w-full border-rose-gold/30 text-kindle hover:bg-rose-gold/10 py-3"
              >
                {resetMutation.isPending ? "Resetting..." : "Read Again"}
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation - only show if not at ending */}
      {!isEnding && (
        <div className="fixed bottom-0 left-0 right-0 bg-kindle/95 backdrop-blur-sm border-t border-dark-tertiary/30">
          <div className="flex items-center justify-between px-6 py-4 max-w-3xl mx-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="text-kindle hover:text-rose-gold disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Back
            </Button>
            
            <div className="text-center">
              <div className="text-sm font-medium text-kindle-secondary">
                {story.title}
              </div>
              <button
                onClick={() => resetMutation.mutate()}
                className="text-xs text-kindle-secondary hover:text-rose-gold underline mt-1"
              >
                Start over
              </button>
            </div>
            
            {choices.length === 0 && currentPage < totalPages ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={goToNextPage}
                className="text-kindle hover:text-rose-gold"
              >
                Next
                <ChevronLeft className="w-5 h-5 ml-1 rotate-180" />
              </Button>
            ) : (
              <div className="w-16" /> // Spacer when choices are present
            )}
          </div>
        </div>
      )}
    </div>
  );
}