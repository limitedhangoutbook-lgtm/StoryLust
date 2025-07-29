import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Gem, Heart, Bookmark, Share } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation, useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Story, StoryNode, StoryChoice } from "@shared/schema";

export default function StoryReader() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/story/:storyId");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const storyId = params?.storyId;

  // Fetch story details
  const { data: story, isLoading: storyLoading } = useQuery<Story>({
    queryKey: ["/api/stories", storyId],
    enabled: !!storyId,
  });

  // Fetch current reading progress
  const { data: progress } = useQuery({
    queryKey: ["/api/reading-progress", storyId],
    enabled: !!storyId && !!user,
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

    if ((progress as any)?.currentNodeId) {
      setCurrentNodeId((progress as any).currentNodeId);
      setIsBookmarked(!!(progress as any).isBookmarked);
    } else {
      // Fetch starting node
      queryClient.fetchQuery({
        queryKey: ["/api/stories", storyId, "start"],
      }).then((startingNode: any) => {
        if (startingNode) {
          setCurrentNodeId(startingNode.id);
        }
      });
    }
  }, [storyId, progress, currentNodeId, queryClient]);

  // Choice selection mutation
  const selectChoiceMutation = useMutation({
    mutationFn: async (choiceId: string) => {
      return await apiRequest("POST", `/api/choices/${choiceId}/select`, {
        storyId,
      });
    },
    onSuccess: (data: any) => {
      setCurrentNodeId(data.targetNode.id);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reading-progress"] });
      
      if (data.diamondsSpent > 0) {
        toast({
          title: "Premium Choice Unlocked",
          description: `You spent ${data.diamondsSpent} diamonds to unlock this path.`,
        });
      }
    },
    onError: (error: any) => {
      if (error.message.includes("Insufficient diamonds")) {
        toast({
          title: "Not Enough Diamonds",
          description: "You need more diamonds to unlock this premium choice.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to make choice. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  // Bookmark mutation
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
  });

  const handleChoiceSelect = (choiceId: string, isPremium: boolean, diamondCost: number) => {
    const userDiamonds = (user as any)?.diamonds || 0;
    
    if (isPremium && diamondCost > userDiamonds) {
      toast({
        title: "Not Enough Diamonds",
        description: `You need ${diamondCost} diamonds to unlock this choice. Visit the store to get more!`,
        variant: "destructive",
      });
      return;
    }

    selectChoiceMutation.mutate(choiceId);
  };

  const handleBookmark = () => {
    bookmarkMutation.mutate();
  };

  const userDiamonds = (user as any)?.diamonds || 0;

  if (!match || !storyId) {
    return (
      <div className="max-w-md mx-auto bg-dark-primary min-h-screen flex items-center justify-center">
        <p className="text-text-muted">Story not found</p>
      </div>
    );
  }

  if (storyLoading || nodeLoading || !currentNode) {
    return (
      <div className="max-w-md mx-auto bg-dark-primary min-h-screen">
        <header className="sticky top-0 z-50 bg-dark-primary/95 backdrop-blur-sm border-b border-dark-tertiary p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="h-8 w-8 p-0 hover:bg-dark-tertiary"
            >
              <ArrowLeft size={16} className="text-text-muted" />
            </Button>
            <div className="h-6 bg-dark-tertiary rounded w-32 animate-pulse"></div>
          </div>
        </header>
        
        <div className="p-4 space-y-4">
          <div className="h-4 bg-dark-tertiary rounded animate-pulse"></div>
          <div className="h-4 bg-dark-tertiary rounded w-3/4 animate-pulse"></div>
          <div className="h-20 bg-dark-tertiary rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-dark-primary min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-dark-primary/95 backdrop-blur-sm border-b border-dark-tertiary">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="h-8 w-8 p-0 hover:bg-dark-tertiary"
            >
              <ArrowLeft size={16} className="text-text-muted" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="font-semibold text-text-primary truncate">
                {story?.title || "Loading..."}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-dark-tertiary px-2 py-1 rounded-full">
              <Gem className="text-gold-accent" size={12} />
              <span className="text-xs font-medium text-text-primary">
                {userDiamonds}
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBookmark}
              disabled={bookmarkMutation.isPending}
              className="h-8 w-8 p-0 hover:bg-dark-tertiary"
            >
              <Heart 
                size={16} 
                className={isBookmarked ? "fill-rose-gold text-rose-gold" : "text-text-muted"} 
              />
            </Button>
          </div>
        </div>
      </header>

      {/* Story Content */}
      <main className="px-4 py-6 space-y-6">
        {/* Story Info */}
        {story && (
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-rose-gold/20 text-rose-gold border-rose-gold/30">
                <span className={`spice-${story.spiceLevel} mr-1`}></span>
                {story.spiceLevel === 1 ? "Mild" : story.spiceLevel === 2 ? "Medium" : "Hot"}
              </Badge>
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                {story.category.toUpperCase()}
              </Badge>
            </div>
          </div>
        )}

        {/* Current Node Content */}
        <Card className="bg-dark-secondary border-dark-tertiary">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-text-primary leading-tight">
                {currentNode.title}
              </h2>
              
              <div className="prose prose-invert max-w-none">
                <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {currentNode.content}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Choices */}
        {choices.length > 0 && (
          <div className="space-y-3">
            <Separator className="bg-dark-tertiary" />
            <h3 className="text-sm font-medium text-text-muted uppercase tracking-wide">
              What do you choose?
            </h3>
            
            <div className="space-y-3">
              {choices.map((choice, index) => {
                const isPremium = choice.isPremium;
                const diamondCost = choice.diamondCost || 0;
                const canAfford = userDiamonds >= diamondCost;
                const isDisabled = selectChoiceMutation.isPending;
                
                return (
                  <Card 
                    key={choice.id}
                    className={`cursor-pointer transition-all duration-200 ${
                      isPremium 
                        ? "bg-gradient-to-r from-rose-gold/10 to-gold-accent/10 border-rose-gold/30 hover:border-rose-gold/50" 
                        : "bg-dark-secondary border-dark-tertiary hover:border-rose-gold/30"
                    } ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => !isDisabled && handleChoiceSelect(choice.id, !!isPremium, diamondCost)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 pr-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-xs bg-dark-tertiary text-text-muted px-2 py-1 rounded-full">
                              Choice {index + 1}
                            </span>
                            {isPremium && (
                              <div className="flex items-center space-x-1">
                                <Gem className="text-gold-accent" size={12} />
                                <span className="text-xs font-medium text-gold-accent">
                                  {diamondCost}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-text-primary leading-relaxed">
                            {choice.choiceText}
                          </p>
                        </div>
                        
                        {isPremium && !canAfford && (
                          <Badge variant="destructive" className="text-xs">
                            Need {diamondCost - userDiamonds} more
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* End of Story */}
        {choices.length === 0 && (
          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 gradient-rose-gold rounded-2xl flex items-center justify-center mx-auto">
                  <Heart className="w-6 h-6 text-dark-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary mb-2">
                    The End
                  </h3>
                  <p className="text-text-muted">
                    You've reached the end of this story path. Thank you for reading!
                  </p>
                </div>
                <div className="flex space-x-3">
                  <Button 
                    onClick={() => setLocation("/")}
                    className="flex-1 bg-rose-gold text-dark-primary hover:bg-rose-gold/90"
                  >
                    Browse More Stories
                  </Button>
                  <Button 
                    onClick={() => setLocation("/my-reading")}
                    variant="outline"
                    className="flex-1 border-dark-tertiary text-text-primary hover:bg-dark-tertiary"
                  >
                    My Reading
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}