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
    isFirstChoice?: boolean;
  }>>({
    queryKey: [`/api/stories/${storyId}/pages`],
    enabled: !!storyId,
  });

  // Get choices for current page (PAGE-BASED ONLY)
  const currentPageData = allPages[currentPage - 1]; // Convert 1-based page to 0-based index
  const { data: choices = [] } = useQuery<Array<{ 
    id: string; 
    choiceText: string; 
    isPremium: boolean; 
    eggplantCost?: number;
    targetPage: number;
  }>>({
    queryKey: [`/api/pages/${currentPage}/choices?storyId=${storyId}`],
    enabled: !!storyId && currentPage > 0,
  });

  // Get progress (page-based only)
  const { data: progress } = useQuery<{ currentPage?: number }>({
    queryKey: [`/api/reading-progress/${storyId}`],
    enabled: !!storyId && isAuthenticated,
  });

  // Set total pages when data loads and fix progress logic
  useEffect(() => {
    if (allPages.length > 0) {
      setTotalPages(allPages.length);
      
      // ALWAYS start at page 1 unless we have valid progress
      let targetPage = 1;
      
      // Check authenticated user progress first
      if (progress?.currentPage && progress.currentPage >= 1 && progress.currentPage <= allPages.length) {
        targetPage = progress.currentPage;
      } else if (!isAuthenticated) {
        // Check localStorage for guests only if not authenticated
        const savedPage = localStorage.getItem(`story-${storyId}-page`);
        if (savedPage) {
          const savedPageNum = parseInt(savedPage);
          if (savedPageNum >= 1 && savedPageNum <= allPages.length) {
            targetPage = savedPageNum;
          }
        }
      }
      
      setCurrentPage(targetPage);
    }
  }, [allPages, progress, storyId, isAuthenticated]);

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
    if (!storyId) return;

    // Save locally (page-based only)
    localStorage.setItem(`story-${storyId}-page`, pageNumber.toString());
    
    // Save to server if authenticated (page-based only)
    if (isAuthenticated) {
      apiRequest("POST", "/api/reading-progress", {
        storyId,
        currentPage: pageNumber, // Pure page-based progress
        pagesRead: pageNumber,
        isBookmarked: false,
      }).catch(() => {});
    }
  };

  // Navigate to first choice page for re-exploration
  const goToFirstChoice = async () => {
    if (!storyId || !allPages.length) return;
    
    try {
      // Get the first choice page from the server
      const response = await apiRequest("GET", `/api/stories/${storyId}/first-choice-page`);
      const data = await response.json();
      
      const firstChoicePageNumber = data.firstChoicePageNumber || 5; // Fallback to page 5
      
      // Navigate to the first choice page
      setCurrentPage(firstChoicePageNumber);
      saveProgress(firstChoicePageNumber);
      
      toast({
        title: "Ready to Explore!",
        description: "You're now at the first choice point. Choose your path!",
        duration: 2000,
      });
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      // Fallback to hardcoded logic if API fails
      let firstChoicePageNumber = 5; // Default fallback
      
      if (storyId === 'desert-seduction') {
        firstChoicePageNumber = 2; // Desert Encounter has choices
      } else if (storyId === 'campus-encounter') {
        firstChoicePageNumber = 5; // The Moment has choices  
      }
      
      setCurrentPage(firstChoicePageNumber);
      saveProgress(firstChoicePageNumber);
      
      toast({
        title: "Ready to Explore!",
        description: "You're now at the first choice point. Choose your path!",
        duration: 2000,
      });
      
      window.scrollTo({ top: 0, behavior: 'smooth' });
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
        currentPage: currentPage, // PAGE-BASED ONLY
      });
      return response.json();
    },
    onSuccess: (data, choiceId) => {
      if (data.targetPage) {
        // Direct page-based navigation
        const targetPageNumber = data.targetPage;
        if (targetPageNumber >= 1 && targetPageNumber <= totalPages) {
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
      // Clear local storage
      localStorage.removeItem(`story-${storyId}-page`);
      
      // Clear server progress if authenticated
      if (isAuthenticated) {
        await apiRequest("POST", `/api/stories/${storyId}/start-from-beginning`);
      }
    },
    onSuccess: () => {
      // Reset to page 1
      setCurrentPage(1);
      // Refresh reading progress
      queryClient.invalidateQueries({ queryKey: [`/api/reading-progress/${storyId}`] });
    },
  });

  // Check if story is ending
  const isEnding = currentPageData?.content?.includes("**THE END**") || false;

  if (!story || !currentPageData || allPages.length === 0) {
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
          
          <div className="flex items-center space-x-2">
            {/* Floating Eggplant Counter */}
            {isAuthenticated && user && (
              <div className="flex items-center space-x-1 bg-dark-tertiary/30 px-2 py-1 rounded-full text-xs">
                <span className="text-sm">🍆</span>
                <span className="text-kindle font-medium">
                  {(user as any)?.eggplants || 0}
                </span>
              </div>
            )}
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
          <h2 className="text-lg sm:text-xl font-bold text-kindle mb-3 sm:mb-4">{currentPageData.title}</h2>
          {currentPageData.content.split('\n\n').map((paragraph, index) => (
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
                      <div className="mt-2">
                        {choice.isOwned ? (
                          <div className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 bg-green-500/15 text-green-400 border border-green-500/30 rounded-full text-xs sm:text-sm font-semibold">
                            <span>✓</span>
                            <span>OWNED</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1 bg-rose-gold/15 text-rose-gold border border-rose-gold/30 rounded-full text-xs sm:text-sm font-semibold">
                            <span>🍆</span>
                            <span>{choice.eggplantCost || 0} eggplants</span>
                          </div>
                        )}
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
                onClick={() => goToFirstChoice()}
                className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-bold py-4 text-lg hover:from-purple-700 hover:to-purple-800"
              >
                <div className="flex items-center justify-center">
                  <span className="text-2xl mr-2">🔀</span>
                  Try Different Path
                </div>
              </Button>
              
              <Button
                onClick={() => resetMutation.mutate()}
                disabled={resetMutation.isPending}
                variant="outline"
                className="w-full border-rose-gold/30 text-kindle hover:bg-rose-gold/10 py-3"
              >
                {resetMutation.isPending ? "Resetting..." : "Read from Beginning"}
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