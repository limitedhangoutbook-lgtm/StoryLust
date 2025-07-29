import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Gem, Heart, Bookmark, ChevronRight, BookOpen } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  const [readingProgress, setReadingProgress] = useState(10);

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
          setReadingProgress(Math.min(100, (progress.nodeCount || 1) * 10));
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
      });
    }
  }, [storyId, currentNodeId, queryClient, isAuthenticated]);

  // Choice selection mutation
  const selectChoiceMutation = useMutation({
    mutationFn: async (choiceId: string) => {
      if (!isAuthenticated) {
        // For guests, simulate choice selection without API call
        const choice = choices.find(c => c.id === choiceId);
        if (!choice) throw new Error("Choice not found");
        
        if (choice.isPremium) {
          throw new Error("Sign in required for premium choices");
        }
        
        return { targetNode: { id: choice.toNodeId }, choice, diamondsSpent: 0 };
      }
      
      return await apiRequest("POST", `/api/choices/${choiceId}/select`, {
        storyId,
      });
    },
    onSuccess: (data: any) => {
      setCurrentNodeId(data.targetNode.id);
      setShowChoices(false);
      setReadingProgress(prev => Math.min(100, prev + 15));
      
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ["/api/reading-progress", storyId] });
      }
      
      if (data.diamondsSpent > 0) {
        toast({
          title: "Premium Choice Selected",
          description: `${data.diamondsSpent} diamonds spent`,
        });
      }
    },
    onError: (error: Error) => {
      if (error.message === "Sign in required for premium choices") {
        toast({
          title: "Sign In Required",
          description: "Please sign in to unlock premium story paths",
          variant: "destructive",
        });
        return;
      }
      
      if (isUnauthorizedError(error)) {
        toast({
          title: "Sign In Required", 
          description: "Please sign in to continue your story",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 2000);
        return;
      }
      
      toast({
        title: "Error",
        description: error.message || "Failed to select choice",
        variant: "destructive",
      });
    },
  });

  // Bookmark mutation (authenticated users only)
  const bookmarkMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/stories/${storyId}/bookmark`);
    },
    onSuccess: () => {
      setIsBookmarked(!isBookmarked);
      queryClient.invalidateQueries({ queryKey: ["/api/reading-progress"] });
      toast({
        title: isBookmarked ? "Bookmark Removed" : "Story Bookmarked",
        description: isBookmarked 
          ? "Removed from your reading list" 
          : "Added to your reading list",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Sign In Required",
          description: "Please sign in to bookmark stories",
          variant: "destructive",
        });
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
          setCurrentNodeId(nextNode.id);
          setReadingProgress(prev => Math.min(100, prev + 10));
          
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

  const getPageNumber = (nodeId: string | null): number => {
    if (!nodeId) return 1;
    if (nodeId === "start") return 1;
    if (nodeId.startsWith("page-")) {
      const pageNum = parseInt(nodeId.split("-")[1]);
      return pageNum || 1;
    }
    return 1;
  };

  const getTotalPages = (storyId: string | null): number => {
    // Return estimated total story length (not just pages before choices)
    const storyLengths: Record<string, number> = {
      "campus-encounter": 25,
      "midnight-coffee": 30
    };
    return storyLengths[storyId || ""] || 20;
  };

  const getNavigationText = (currentId: string | null, hasChoices: boolean): string | null => {
    if (hasChoices) return null; // Choices replace navigation
    
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
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-rose-gold border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-text-muted">Loading story...</p>
        </div>
      </div>
    );
  }

  // Only show error state if we definitively failed to load
  if (storyId && !storyLoading && !story) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center text-center px-4">
        <div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Story not found</h2>
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
    <div className="min-h-screen bg-dark-primary text-text-primary">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-dark-primary/95 backdrop-blur-sm border-b border-dark-tertiary">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="text-text-muted hover:text-text-primary"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-text-primary">{story?.title}</h1>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <Progress value={readingProgress} className="w-20 h-1" />
                  <span className="text-xs text-text-muted">{readingProgress}%</span>
                </div>
                <div className="flex items-center space-x-1 text-xs text-text-muted">
                  <BookOpen className="w-3 h-3" />
                  <span>{getPageNumber(currentNodeId)}/{getTotalPages(storyId || "")}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {isAuthenticated && (
              <>
                <div className="flex items-center space-x-1 px-2 py-1 bg-dark-secondary rounded-lg">
                  <Gem className="w-4 h-4 text-rose-gold" />
                  <span className="text-sm font-medium">{userDiamonds}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBookmark}
                  className={isBookmarked ? "text-rose-gold" : "text-text-muted hover:text-text-primary"}
                  disabled={bookmarkMutation.isPending}
                >
                  <Heart className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`} />
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Story Content */}
      <main className="px-4 py-6 max-w-2xl mx-auto">
        <div className="space-y-6">
          {/* Story Node Content */}
          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-text-primary">
                    {currentNode?.title}
                  </h2>
                  {currentNode && (currentNode as any).isPremium && (
                    <Badge className="bg-rose-gold/20 text-rose-gold border-rose-gold/30">
                      <Gem className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
                
                <div className="prose prose-invert max-w-none">
                  <p className="text-text-secondary leading-relaxed whitespace-pre-line">
                    {currentNode?.content}
                  </p>
                </div>

              </div>
            </CardContent>
          </Card>

          {/* Navigation - either Continue Reading or Choice Selection */}
          <div className="flex justify-center pt-4">
            {showChoices && choices.length > 0 ? (
              // Choice buttons replace the navigation
              <div className="w-full space-y-3">
                {choices.map((choice) => (
                  <Button
                    key={choice.id}
                    onClick={() => handleChoiceSelect(choice.id, choice.isPremium, choice.diamondCost)}
                    disabled={selectChoiceMutation.isPending}
                    className="w-full p-4 h-auto text-left bg-dark-secondary hover:bg-dark-accent transition-colors border border-dark-tertiary hover:border-rose-gold/30"
                    variant="outline"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-text-secondary group-hover:text-text-primary transition-colors">
                        {choice.choiceText}
                      </span>
                      {choice.isPremium && (
                        <div className="flex items-center gap-1 text-rose-gold">
                          <Heart className="w-4 h-4" />
                          <span className="text-sm font-medium">{choice.diamondCost}</span>
                        </div>
                      )}
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              // Regular continue reading button
              getNavigationText(currentNodeId, false) && (
                <Button
                  onClick={handleContinueReading}
                  disabled={selectChoiceMutation.isPending}
                  className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90 px-8 py-3 rounded-full font-medium"
                >
                  {getNavigationText(currentNodeId, false)}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )
            )}
          </div>
        </div>
      </main>
    </div>
  );
}