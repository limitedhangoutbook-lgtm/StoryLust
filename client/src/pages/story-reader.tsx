import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Heart, Settings, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StoryNavigation } from "@/components/story-navigation";
import { TypographySettings } from "@/components/typography-settings";
import { VipMessageAuthor } from "@/components/vip-message-author";
import { BookmarkManager } from "@/components/bookmark-manager";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { useAuth } from "@/hooks/useAuth";
import { useLocation, useRoute } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { isVip } from "@shared/userRoles";
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
  const [showVipMessage, setShowVipMessage] = useState(false);
  const [showBookmarkManager, setShowBookmarkManager] = useState(false);


  const [showNavigation, setShowNavigation] = useState(true);
  
  // Touch gesture handling
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const mainContentRef = useRef<HTMLDivElement>(null);
  const hideNavTimeout = useRef<NodeJS.Timeout | null>(null);

  const storyId = params?.storyId;



  // Fetch story details with caching
  const { data: story, isLoading: storyLoading } = useQuery<Story>({
    queryKey: ["/api/stories", storyId],
    enabled: !!storyId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Fetch current node with caching
  const { data: currentNode, isLoading: nodeLoading } = useQuery<StoryNode>({
    queryKey: ["/api/nodes", currentNodeId],
    enabled: !!currentNodeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch choices for current node with caching
  const { data: choices = [] } = useQuery<StoryChoice[]>({
    queryKey: ["/api/nodes", currentNodeId, "choices"],
    enabled: !!currentNodeId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Initialize story on load and handle position restoration
  useEffect(() => {
    if (!storyId || currentNodeId) return;

    // Check for saved position from login flow
    const savedPosition = sessionStorage.getItem('returnPosition');
    const pendingChoice = sessionStorage.getItem('pendingChoice');
    
    if (savedPosition) {
      try {
        const position = JSON.parse(savedPosition);
        if (position.storyId === storyId && position.nodeId) {
          setCurrentNodeId(position.nodeId);
          sessionStorage.removeItem('returnPosition');
          // Update reading progress with return position
          if (isAuthenticated) {
            apiRequest("POST", "/api/reading-progress", {
              storyId,
              currentNodeId: position.nodeId,
              isBookmarked: false
            }).catch(error => {

            });
          }
          return;
        }
      } catch (e) {

      }
      sessionStorage.removeItem('returnPosition');
    }
    
    // Check for pending choice after login
    if (pendingChoice && isAuthenticated) {
      try {
        const choice = JSON.parse(pendingChoice);
        if (choice.storyId === storyId && choice.nodeId) {
          setCurrentNodeId(choice.nodeId);
          sessionStorage.removeItem('pendingChoice');
          // Auto-retry the choice after a short delay
          setTimeout(() => {
            if (choice.choiceId) {
              handleChoiceSelect(choice.choiceId, true, 0);
            }
          }, 1500);
          return;
        }
      } catch (e) {

      }
      sessionStorage.removeItem('pendingChoice');
    }

    // Normal initialization - get progress for authenticated users or local storage for guests
    if (isAuthenticated) {
      queryClient.fetchQuery({
        queryKey: ["/api/reading-progress", storyId],
      }).then((progress: any) => {
        if (progress?.currentNodeId) {
          // Check if story is completed - if so, restart from beginning
          if (progress.isCompleted) {
            fetchStartingNode();
            // Reset completion status
            apiRequest("POST", "/api/reading-progress", {
              storyId,
              currentNodeId: "", // Will be set by fetchStartingNode
              isBookmarked: progress.isBookmarked || false,
              isCompleted: false,
              completedAt: null,
            }).catch(() => {});
          } else {
            setCurrentNodeId(progress.currentNodeId);
            setIsBookmarked(!!progress.isBookmarked);
            // Invalidate progress queries to ensure fresh data
            queryClient.invalidateQueries({ queryKey: ["/api/reading-progress"] });
          }
        } else {
          // Check local storage as fallback
          checkLocalProgress() || fetchStartingNode();
        }
      }).catch(() => {
        // If no progress found, check local storage or start from beginning
        checkLocalProgress() || fetchStartingNode();
      });
    } else {
      // For guests, check local storage first
      checkLocalProgress() || fetchStartingNode();
    }

    function checkLocalProgress(): boolean {
      try {
        const localProgress = localStorage.getItem(`story-progress-${storyId}`);
        if (localProgress) {
          const progress = JSON.parse(localProgress);
          if (progress.nodeId && progress.timestamp && Date.now() - progress.timestamp < 7 * 24 * 60 * 60 * 1000) { // 7 days
            setCurrentNodeId(progress.nodeId);

            return true;
          }
        }
      } catch (e) {

      }
      return false;
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

  // Save local progress helper
  const saveLocalProgress = (nodeId: string) => {
    try {
      const progress = {
        nodeId,
        timestamp: Date.now()
      };
      localStorage.setItem(`story-progress-${storyId}`, JSON.stringify(progress));

    } catch (e) {

    }
  };

  // Go back handler  
  const handleGoBack = useCallback(() => {
    if (pageHistory.length > 0) {
      const previousNodeId = pageHistory[pageHistory.length - 1];
      setPageHistory(prev => prev.slice(0, -1));
      setCurrentNodeId(previousNodeId);
      // Save local progress when going back
      saveLocalProgress(previousNodeId);
      setShowChoices(false);
      // Show navigation temporarily when going back
      showNavigationTemporarily();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // If no history, go back to homepage
      setLocation("/");
    }
  }, [pageHistory.length, setLocation]);

  // Check if current node is a story ending
  const isStoryEnding = currentNode?.content?.includes("**THE END**") || false;

  // Go to first choice handler
  const handleGoToFirstChoice = () => {
    // Navigate to page-5 which has the first choice
    setCurrentNodeId("page-5");
    setPageHistory(["start", "page-2", "page-3", "page-4"]); // Set proper history to get to page-5
    setShowChoices(false);
    
    // Save reading progress
    if (isAuthenticated) {
      apiRequest("POST", "/api/reading-progress", {
        storyId,
        currentNodeId: "page-5",
        isBookmarked: isBookmarked
      }).catch(error => {
        // Silently handle reading progress save error
      });
    }
    
    // Save to local storage as backup
    saveLocalProgress("page-5");
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Read from beginning handler
  const handleReadFromBeginning = async () => {
    // Reset to starting node
    try {
      const startingNodeResponse = await queryClient.fetchQuery({
        queryKey: ["/api/stories", storyId, "start"],
      });
      
      if (startingNodeResponse) {
        setCurrentNodeId((startingNodeResponse as any).id);
        setPageHistory([]); // Clear history
        setShowChoices(false);
        
        // Reset reading progress
        if (isAuthenticated) {
          apiRequest("POST", "/api/reading-progress", {
            storyId,
            currentNodeId: (startingNodeResponse as any).id,
            isBookmarked: false
          }).catch(error => {
            // Silently handle error
          });
        }
        
        // Save to local storage
        saveLocalProgress((startingNodeResponse as any).id);
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        toast({
          title: "Starting Over",
          description: "Reading from the beginning...",
          duration: 1500,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restart story. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Continue reading handler
  const handleContinueReading = useCallback(async () => {
    if (choices.length > 0) {
      // This page has choices, show them
      setShowChoices(true);
    } else if (isStoryEnding) {
      // Mark story as completed for authenticated users
      if (isAuthenticated) {
        try {
          await apiRequest("POST", `/api/stories/${storyId}/complete`);
        } catch (completionError) {
          // Silently handle completion error
        }
      }
      
      // This is a story ending, return to homepage
      setLocation("/");
      toast({
        title: "Story Complete",
        description: "Thank you for reading! Check out more stories.",
      });
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
          
          // Save reading progress for authenticated users and local storage for guests
          if (isAuthenticated) {
            apiRequest("POST", "/api/reading-progress", {
              storyId,
              currentNodeId: nextNode.id,
              isBookmarked: isBookmarked
            }).catch(error => {
              // Silently handle reading progress save error
            });
          }
          // Always save to local storage as backup
          saveLocalProgress(nextNode.id);
          
          // Reset choices state for new page
          setShowChoices(false);
          
          // Scroll to top for new page
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          // Story ended - no next node found
          setLocation("/");
          toast({
            title: "Story Complete",
            description: "You've reached the end of this story path!",
          });
        }
      } catch (error: any) {

        // If it's a 404 (no next page), treat as story ending
        if (error.message?.includes('404')) {
          // Mark story as completed for authenticated users
          if (isAuthenticated) {
            try {
              await apiRequest("POST", `/api/stories/${storyId}/complete`);
            } catch (completionError) {
              // Silently handle completion error
            }
          }
          
          setLocation("/");
          toast({
            title: "Story Complete",
            description: "You've reached the end of this story path!",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to load next page. Please try again.",
            variant: "destructive",
          });
        }
      }
    }
  }, [choices.length, isStoryEnding, isAuthenticated, storyId, currentNodeId, isBookmarked, setLocation, toast]);

  // Auto-hide navigation after inactivity
  const showNavigationTemporarily = () => {
    setShowNavigation(true);
    
    // Clear existing timeout
    if (hideNavTimeout.current) {
      clearTimeout(hideNavTimeout.current);
    }
    
    // Hide navigation after 3 seconds of inactivity
    hideNavTimeout.current = setTimeout(() => {
      setShowNavigation(false);
    }, 3000);
  };

  // Add touch event listeners for swipe gestures and navigation control
  useEffect(() => {
    const mainElement = mainContentRef.current;
    if (!mainElement) return;

    console.log('Setting up touch listeners'); // Debug log

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
      console.log('Touch start:', touchStartRef.current); // Debug log
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current || e.changedTouches.length !== 1) return;
      
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const deltaTime = Date.now() - touchStartRef.current.time;
      
      console.log('Touch end:', { deltaX, deltaY, deltaTime, showChoices, historyLength: pageHistory.length }); // Debug log
      
      // Only handle swipes that are primarily horizontal and fast enough
      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50;
      const isFastEnough = deltaTime < 300;
      
      if (isHorizontalSwipe && isFastEnough && !showChoices) {
        e.preventDefault(); // Prevent default touch behavior
        if (deltaX > 0 && pageHistory.length > 0) {
          // Swipe right - go back
          console.log('Swipe right - going back');
          handleGoBack();
        } else if (deltaX < 0) {
          // Swipe left - continue reading
          console.log('Swipe left - continuing');
          handleContinueReading();
        }
      } else if (!isHorizontalSwipe && Math.abs(deltaX) < 20 && Math.abs(deltaY) < 20) {
        // Simple tap - show navigation temporarily
        showNavigationTemporarily();
      }
      
      touchStartRef.current = null;
    };

    mainElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    mainElement.addEventListener('touchend', handleTouchEnd, { passive: false }); // Changed to false to allow preventDefault

    return () => {
      console.log('Cleaning up touch listeners');
      mainElement.removeEventListener('touchstart', handleTouchStart);
      mainElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [showChoices, pageHistory.length, handleGoBack, handleContinueReading]); // Added missing dependencies

  // Separate effect for navigation auto-hiding
  useEffect(() => {
    const handleScroll = () => showNavigationTemporarily();
    const handleMouseMove = () => showNavigationTemporarily();

    window.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []); // No dependencies - just event listeners

  const selectChoiceMutation = useMutation({
    mutationFn: async (choiceId: string) => {

      const response = await apiRequest("POST", `/api/choices/${choiceId}/select`, {
        storyId,
        currentNodeId,
      });
      const data = await response.json();

      return data;
    },
    onSuccess: (data) => {

      if (data.targetNode && data.targetNode.id) {
        // Add current page to history before navigating
        if (currentNodeId) {
          setPageHistory(prev => [...prev, currentNodeId]);
        }
        
        setCurrentNodeId(data.targetNode.id);
        setShowChoices(false);
        
        // Scroll to top for new content
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Save reading progress for authenticated users and local storage for guests
        if (data.targetNode?.id) {
          if (isAuthenticated) {
            apiRequest("POST", "/api/reading-progress", {
              storyId,
              currentNodeId: data.targetNode.id,
              isBookmarked: isBookmarked
            }).catch(error => {
              // Silently handle reading progress save error
            });
            
            // Refresh user data to update diamond count
            queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
          }
          
          // Always save to local storage as backup
          saveLocalProgress(data.targetNode.id);
        }
        
        // Find the selected choice to determine if it was premium
        const selectedChoice = choices.find(c => c.id === (selectChoiceMutation.variables as string));
        toast({
          title: selectedChoice?.isPremium ? "🍆✨ Premium Choice Made! ✨🍆" : "✨ Choice Made! ✨", 
          description: "Your story path unfolds...",
          duration: 1000, // Disappear after 1 second to avoid blocking navigation
        });
      } else {

        toast({
          title: "Error",
          description: "Failed to navigate to next story section.",
          variant: "destructive",
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/nodes"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reading-progress"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        // Save current position for return after login
        const currentPosition = {
          storyId,
          nodeId: currentNodeId,
          timestamp: Date.now()
        };
        sessionStorage.setItem('returnPosition', JSON.stringify(currentPosition));
        
        toast({
          title: "Session Expired",
          description: "Please sign in again to continue",
          variant: "destructive",
        });
        
        // Open login in popup
        const loginUrl = `/api/login?return_to=${encodeURIComponent(window.location.pathname)}&popup=true`;
        const popup = window.open(
          loginUrl,
          'login',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );
        
        // Listen for popup messages
        const handleMessage = (event: MessageEvent) => {
          if (event.data === 'login_success') {
            popup?.close();
            queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            window.location.reload();
          }
        };
        
        window.addEventListener('message', handleMessage);
        
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleMessage);
            queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
          }
        }, 1000);
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
      
      const response = await apiRequest("POST", `/api/stories/${storyId}/bookmark`);
      return response.json();
    },
    onSuccess: (data) => {
      setIsBookmarked(data.isBookmarked);
      toast({
        title: data.isBookmarked ? "Story Bookmarked" : "Bookmark Removed",
        description: data.isBookmarked ? "Added to your reading list" : "Removed from your reading list",
      });
      // Refresh reading progress list
      queryClient.invalidateQueries({ queryKey: ["/api/reading-progress"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        // Save current position for return after login  
        const currentPosition = {
          storyId,
          nodeId: currentNodeId,
          timestamp: Date.now()
        };
        sessionStorage.setItem('returnPosition', JSON.stringify(currentPosition));
        
        toast({
          title: "Session Expired",
          description: "Please sign in again to continue",
          variant: "destructive",
        });
        
        // Open login in popup
        const loginUrl = `/api/login?return_to=${encodeURIComponent(window.location.pathname)}`;
        const popup = window.open(
          loginUrl,
          'login', 
          'width=500,height=600,scrollbars=yes,resizable=yes'
        );
        
        const checkClosed = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkClosed);
            window.location.reload();
          }
        }, 1000);
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
    // Only require authentication for premium choices
    if (isPremium && !isAuthenticated) {
      toast({
        title: "Sign In Required",
        description: "Sign in to unlock premium story paths with eggplants",
        variant: "destructive",
      });
      
      // Redirect to login with return URL that brings back to current story page
      const currentUrl = window.location.href;
      window.location.href = `/api/login?returnTo=${encodeURIComponent(currentUrl)}`;
      return;
    }

    // Check diamond balance only for authenticated premium choices
    if (isPremium && isAuthenticated) {
      const userDiamonds = (user as any)?.diamonds || 0;
      
      if ((diamondCost || 0) > userDiamonds) {
        toast({
          title: "Not Enough Diamonds",
          description: `You need ${diamondCost || 0} diamonds to unlock this choice. Visit the store to get more!`,
          variant: "destructive",
        });
        return;
      }
    }

    // Process choice selection immediately
    selectChoiceMutation.mutate(choiceId);
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
    
    // Check if this is a story ending
    if (isStoryEnding) {
      return "Return to Stories";
    }
    
    const nextPageId = getNextPageId(currentId);
    if (nextPageId) {
      return "Continue Reading";
    }
    
    return "Return to Stories";
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
            onClick={handleGoBack}
            className="text-kindle-secondary hover:text-kindle p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          {isAuthenticated && (
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setLocation("/store")}
                className="flex items-center space-x-1 px-3 py-1 bg-dark-secondary/50 rounded-full hover:bg-dark-secondary/70 transition-colors cursor-pointer"
              >
                <span className="text-sm">🍆</span>
                <span className="text-sm font-medium text-kindle">{userDiamonds}</span>
              </button>
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
                onClick={() => setShowBookmarkManager(true)}
                className="text-kindle-secondary hover:text-kindle"
              >
                <Bookmark className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => bookmarkMutation.mutate()}
                className={isBookmarked ? "text-rose-gold" : "text-kindle-secondary hover:text-kindle"}
                disabled={bookmarkMutation.isPending || false}
              >
                <Heart className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`} />
              </Button>
            </div>
          )}
        </div>
      </header>

      {/* Story Content - Full screen like Kindle with touch area */}
      <main 
        ref={mainContentRef} 
        className={`pt-16 px-6 max-w-3xl mx-auto min-h-screen touch-manipulation ${
          showChoices ? 'pb-32' : 'pb-20'
        }`}
        style={{ touchAction: 'manipulation' }}
      >
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

        {/* Choices section - integrated with story text */}
        {showChoices && choices.length > 0 && (
          <div className="mt-8 mb-16">
            <div className="space-y-6">
              {choices.map((choice, index) => {
                return (
                  <div key={choice.id} className="kindle-text relative">
                    <button
                      onClick={() => {
                        handleChoiceSelect(choice.id, choice.isPremium || false, choice.diamondCost || undefined);
                      }}
                      disabled={selectChoiceMutation.isPending}
                      className={`w-full text-left transition-all duration-300 group relative overflow-hidden rounded-lg ${
                        choice.isPremium 
                          ? 'hover:text-rose-gold' 
                          : 'hover:text-kindle-secondary'
                      } hover:bg-dark-secondary/30`}
                    >
                      <p className="kindle-paragraph relative pl-8 py-2 px-3">
                        <span className={`absolute left-3 top-2 font-bold ${
                          choice.isPremium ? 'text-rose-gold' : 'text-kindle-secondary'
                        }`}>
                          {String.fromCharCode(65 + index)}.
                        </span>
                        <span className="underline decoration-dotted decoration-1 underline-offset-4 group-hover:decoration-solid">
                          {choice.choiceText}
                        </span>
                        {choice.isPremium && (
                          <span className="ml-3 inline-flex items-center gap-1.5 px-2 py-1 bg-rose-gold/15 text-rose-gold border border-rose-gold/30 rounded-full text-xs font-semibold">
                            <span className="text-xs">🍆</span>
                            <span>{choice.diamondCost || 0} eggplants</span>
                          </span>
                        )}
                      </p>
                      

                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Story Ending Section */}
        {isStoryEnding && (
          <div className="mt-16 mb-32 text-center space-y-8">
            {/* Bold THE END marker */}
            <div className="mb-12">
              <div className="text-6xl font-bold text-rose-gold mb-4">
                THE END
              </div>
              <div className="w-32 h-1 bg-gradient-to-r from-transparent via-rose-gold to-transparent mx-auto"></div>
            </div>
            
            {/* Main action buttons */}
            <div className="space-y-4 max-w-md mx-auto">
              <Button
                onClick={() => setLocation("/")}
                className="w-full bg-gradient-to-r from-rose-gold to-gold-accent text-dark-primary font-bold py-4 text-lg rounded-xl hover:shadow-lg transition-all duration-200 active:scale-95"
              >
                Back to Homepage
              </Button>
              
              {/* VIP Message Author Button */}
              {user && isVip(user) && (
                <Button
                  onClick={() => setShowVipMessage(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-800 text-white font-semibold py-3 rounded-xl border border-purple-400/30 hover:shadow-lg transition-all duration-200 active:scale-95"
                >
                  👑 Message Author (VIP)
                </Button>
              )}
              
              {/* Regular users - encourage VIP upgrade */}
              {user && !isVip(user) && (
                <Button
                  onClick={() => setLocation("/store")}
                  className="w-full bg-dark-secondary text-text-secondary font-medium py-3 rounded-xl border border-dark-tertiary hover:border-rose-gold/30 transition-all duration-200"
                >
                  Upgrade to VIP to Message Author
                </Button>
              )}
            </div>
            
            {/* Story stats */}
            <div className="mt-8 text-sm text-text-muted">
              <p>Thank you for reading {story?.title}!</p>
              <p className="mt-2">Explore more stories on the homepage</p>
            </div>
          </div>
        )}

      </main>



      {/* Story Navigation - Always available when not at story ending */}
      {showNavigation && !isStoryEnding && (
        <div className={`fixed bottom-0 left-0 right-0 transition-all duration-300 ${
          showNavigation ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
        }`}>
          <StoryNavigation
            storyTitle={story?.title || ""}
            canGoBack={pageHistory.length > 0}
            onGoBack={handleGoBack}
            onContinue={handleContinueReading}
            showChoices={showChoices}
            isStoryEnding={isStoryEnding}
            onGoToFirstChoice={handleGoToFirstChoice}
            onReadFromBeginning={handleReadFromBeginning}
          />
        </div>
      )}

      {/* Navigation hint for story endings */}
      {isStoryEnding && !showNavigation && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-dark-secondary/80 backdrop-blur-sm text-kindle-secondary px-4 py-2 rounded-full text-sm">
          💡 Tap to show navigation
        </div>
      )}


      {/* Typography Settings Modal */}
      {showTypographySettings && (
        <TypographySettings 
          isOpen={showTypographySettings}
          onClose={() => setShowTypographySettings(false)} 
        />
      )}

      {/* VIP Message Author Modal */}
      {showVipMessage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-primary rounded-xl max-w-md w-full">
            <VipMessageAuthor 
              storyTitle={story?.title}
              onClose={() => setShowVipMessage(false)}
            />
          </div>
        </div>
      )}

      {/* Bookmark Manager Sheet */}
      <Sheet open={showBookmarkManager} onOpenChange={setShowBookmarkManager}>
        <SheetContent side="right" className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Bookmarks</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            {storyId && currentNodeId && currentNode && (
              <BookmarkManager 
                storyId={storyId}
                nodeId={currentNodeId}
                nodeTitle={currentNode.title}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}