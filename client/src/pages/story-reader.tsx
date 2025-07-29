import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Gem, Heart, Bookmark, ChevronRight } from "lucide-react";
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

  const handleChoiceSelect = (choiceId: string, isPremium: boolean | null, diamondCost: number | null) => {
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

  const handleContinueReading = () => {
    if (choices.length > 0) {
      setShowChoices(true);
    } else {
      // Story ended
      toast({
        title: "Story Complete",
        description: "You've reached the end of this story path!",
      });
    }
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

  if (storyLoading || nodeLoading) {
    return (
      <div className="min-h-screen bg-dark-primary flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-rose-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!story || !currentNode) {
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
              <h1 className="font-semibold text-text-primary">{story.title}</h1>
              <div className="flex items-center space-x-2">
                <Progress value={readingProgress} className="w-20 h-1" />
                <span className="text-xs text-text-muted">{readingProgress}%</span>
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
        {!showChoices ? (
          <div className="space-y-6">
            {/* Story Node Content */}
            <Card className="bg-dark-secondary border-dark-tertiary">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-text-primary">
                      {currentNode.title}
                    </h2>
                    {(currentNode as any).isPremium && (
                      <Badge className="bg-rose-gold/20 text-rose-gold border-rose-gold/30">
                        <Gem className="w-3 h-3 mr-1" />
                        Premium
                      </Badge>
                    )}
                  </div>
                  
                  <div className="prose prose-invert max-w-none">
                    <p className="text-text-secondary leading-relaxed whitespace-pre-line">
                      {currentNode.content}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Continue Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={handleContinueReading}
                disabled={selectChoiceMutation.isPending}
                className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90 px-8 py-3 rounded-full font-medium"
              >
                {choices.length > 0 ? (
                  <>
                    Continue Reading
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  "Story Complete"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Choice Selection */}
            <Card className="bg-dark-secondary border-dark-tertiary">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                  Choose your path:
                </h3>
                
                <div className="space-y-3">
                  {choices.map((choice) => (
                    <Button
                      key={choice.id}
                      onClick={() => handleChoiceSelect(choice.id, choice.isPremium, choice.diamondCost)}
                      disabled={selectChoiceMutation.isPending}
                      variant="outline"
                      className={`w-full justify-start p-4 h-auto text-left border-2 transition-all ${
                        choice.isPremium
                          ? "border-rose-gold/30 bg-rose-gold/5 hover:bg-rose-gold/10 hover:border-rose-gold/50"
                          : "border-dark-tertiary hover:border-text-muted hover:bg-dark-tertiary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-text-primary">{choice.choiceText}</span>
                        {choice.isPremium && (
                          <div className="flex items-center space-x-1 text-rose-gold">
                            <Gem className="w-4 h-4" />
                            <span className="text-sm">{choice.diamondCost}</span>
                          </div>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}