import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Settings, Bookmark, Heart } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TypographySettings } from "@/components/typography-settings";
import { BookmarkManager } from "@/components/bookmark-manager";

interface StoryNode {
  id: string;
  storyId: string;
  title: string;
  content: string;
  isEnding: boolean;
}

interface Choice {
  id: string;
  choiceText: string;
  isPremium: boolean;
  diamondCost?: number;
}

export default function StoryReaderNew() {
  const [match, params] = useRoute("/story/:storyId");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Core state
  const [currentNodeId, setCurrentNodeId] = useState<string>("");
  const [history, setHistory] = useState<string[]>([]);
  const [showChoices, setShowChoices] = useState(false);
  
  // UI state
  const [showSettings, setShowSettings] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  
  const storyId = params?.storyId;

  // Get story data
  const { data: story } = useQuery<{ id: string; title: string }>({
    queryKey: [`/api/stories/${storyId}`],
    enabled: !!storyId,
  });

  // Get current node
  const { data: currentNode } = useQuery<StoryNode>({
    queryKey: [`/api/nodes/${currentNodeId}`],
    enabled: !!currentNodeId,
  });

  // Get choices for current node
  const { data: choices = [] } = useQuery<Choice[]>({
    queryKey: [`/api/nodes/${currentNodeId}/choices`],
    enabled: !!currentNodeId,
  });

  // Get reading progress on mount
  const { data: progress } = useQuery<{ currentNodeId?: string }>({
    queryKey: [`/api/reading-progress/${storyId}`],
    enabled: !!storyId && isAuthenticated,
  });

  // Initialize current node from progress or story start
  useEffect(() => {
    if (!storyId) return;
    
    const savedNodeId = localStorage.getItem(`story-${storyId}-node`);
    // Use the actual starting node IDs from database
    const startNodeId = storyId === 'desert-seduction' ? 'desert-start' : 'start';
    const nodeId = progress?.currentNodeId || savedNodeId || startNodeId;
    setCurrentNodeId(nodeId);
  }, [storyId, progress]);

  // Show choices when they're available and not already shown
  useEffect(() => {
    if (choices.length > 0 && !showChoices && !currentNode?.isEnding) {
      setShowChoices(true);
    }
  }, [choices.length, showChoices, currentNode?.isEnding]);

  // Simple swipe handling
  useEffect(() => {
    let startX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0].clientX;
      const deltaX = endX - startX;
      
      if (Math.abs(deltaX) > 100) {
        if (deltaX > 0 && history.length > 0) {
          // Swipe right - go back
          goBack();
        } else if (deltaX < 0 && choices.length > 0 && !showChoices) {
          // Swipe left - show choices
          setShowChoices(true);
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [history.length, choices.length, showChoices]);

  // Go back function
  const goBack = () => {
    if (history.length === 0) return;
    
    const previousNodeId = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setCurrentNodeId(previousNodeId);
    setShowChoices(false);
  };

  // Select choice mutation
  const selectChoiceMutation = useMutation({
    mutationFn: async ({ choiceId, isPremium, diamondCost }: { 
      choiceId: string; 
      isPremium: boolean; 
      diamondCost?: number; 
    }) => {
      const response = await apiRequest("POST", `/api/choices/${choiceId}/select`, {
        storyId,
        currentNodeId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.targetNode?.id) {
        // Add current node to history
        setHistory(prev => [...prev, currentNodeId]);
        
        // Navigate to new node
        setCurrentNodeId(data.targetNode.id);
        setShowChoices(false);
        
        // Save progress
        saveProgress(data.targetNode.id);
        
        // Show feedback
        const choice = choices.find(c => selectChoiceMutation.variables?.choiceId === c.id);
        toast({
          title: choice?.isPremium ? "🍆✨ Premium Choice Made! ✨🍆" : "✨ Choice Made! ✨",
          description: "Continue reading...",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to make choice",
        variant: "destructive",
      });
    },
  });

  // Save progress
  const saveProgress = (nodeId: string) => {
    localStorage.setItem(`story-${storyId}-node`, nodeId);
    
    if (isAuthenticated && storyId) {
      apiRequest("POST", "/api/reading-progress", {
        storyId,
        currentNodeId: nodeId,
        isBookmarked: false,
      }).catch(() => {
        // Silently handle error
      });
    }
  };

  // Handle choice selection
  const handleChoiceSelect = (choiceId: string, isPremium: boolean, diamondCost?: number) => {
    selectChoiceMutation.mutate({ choiceId, isPremium, diamondCost });
  };

  // Reset story mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      if (isAuthenticated) {
        await apiRequest("DELETE", `/api/reading-progress/${storyId}`);
      }
      localStorage.removeItem(`story-${storyId}-node`);
    },
    onSuccess: () => {
      const startNodeId = storyId === 'desert-seduction' ? 'desert-start' : 'start';
      setCurrentNodeId(startNodeId);
      setHistory([]);
      setShowChoices(false);
      queryClient.invalidateQueries({ queryKey: [`/api/reading-progress/${storyId}`] });
    },
  });

  if (!story || !currentNode) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kindle text-kindle">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-kindle/95 backdrop-blur-sm border-b border-dark-tertiary/30 z-50">
        <div className="flex items-center justify-between px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="text-kindle-secondary hover:text-kindle"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back
          </Button>
          
          <h1 className="text-lg font-semibold text-kindle truncate max-w-xs">
            {story.title}
          </h1>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(true)}
              className="text-kindle-secondary hover:text-kindle"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowBookmarks(true)}
              className="text-kindle-secondary hover:text-kindle"
            >
              <Bookmark className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Story Content */}
      <main className="pt-20 px-6 max-w-3xl mx-auto pb-32">
        {/* Swipe hint */}
        {currentNodeId.includes("start") && (
          <div className="text-center mb-6 text-kindle-secondary text-sm">
            💡 Swipe left to continue, swipe right to go back
          </div>
        )}
        
        {/* Story text */}
        <div className="kindle-text text-kindle space-y-6 mb-8">
          {currentNode.content.split('\n\n').map((paragraph, index) => (
            <p key={index} className="kindle-paragraph">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Choices */}
        {showChoices && choices.length > 0 && (
          <div className="space-y-4 mb-8">
            {choices.map((choice, index) => (
              <button
                key={choice.id}
                onClick={() => handleChoiceSelect(choice.id, choice.isPremium || false, choice.diamondCost)}
                disabled={selectChoiceMutation.isPending}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  choice.isPremium 
                    ? 'border-rose-gold/30 hover:border-rose-gold hover:bg-rose-gold/5' 
                    : 'border-dark-tertiary hover:border-kindle-secondary hover:bg-dark-secondary/30'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <span className={`font-bold ${choice.isPremium ? 'text-rose-gold' : 'text-kindle-secondary'}`}>
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <div className="flex-1">
                    <span className="underline decoration-dotted underline-offset-4">
                      {choice.choiceText}
                    </span>
                    {choice.isPremium && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-rose-gold/15 text-rose-gold border border-rose-gold/30 rounded-full text-xs font-semibold">
                        <span>🍆</span>
                        <span>{choice.diamondCost || 0} eggplants</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Story ending */}
        {currentNode.isEnding && (
          <div className="text-center space-y-6">
            <div className="text-6xl font-bold text-rose-gold mb-4">THE END</div>
            <div className="w-32 h-1 bg-gradient-to-r from-transparent via-rose-gold to-transparent mx-auto mb-8" />
            
            <div className="space-y-4 max-w-md mx-auto">
              <Button
                onClick={() => setLocation("/")}
                className="w-full bg-gradient-to-r from-rose-gold to-gold-accent text-dark-primary font-bold py-4 text-lg"
              >
                Back to Homepage
              </Button>
              
              <Button
                onClick={() => resetMutation.mutate()}
                disabled={resetMutation.isPending}
                className="w-full bg-dark-secondary text-kindle font-semibold py-3 border border-dark-tertiary hover:border-rose-gold/50"
              >
                {resetMutation.isPending ? "Resetting..." : "Start from Beginning"}
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      {!currentNode.isEnding && (
        <div className="fixed bottom-0 left-0 right-0 bg-kindle border-t border-dark-tertiary/30">
          <div className="flex items-center justify-center px-6 py-4 max-w-3xl mx-auto">
            <div className="flex items-center space-x-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={goBack}
                disabled={history.length === 0}
                className="text-kindle hover:text-rose-gold disabled:opacity-30"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
              
              <div className="text-center min-w-[200px]">
                <h2 className="text-sm font-medium text-kindle-secondary">
                  {story.title}
                </h2>
                <button
                  onClick={() => resetMutation.mutate()}
                  className="text-xs text-kindle-secondary hover:text-rose-gold underline mt-1"
                >
                  Read from beginning
                </button>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowChoices(true)}
                disabled={choices.length === 0 || showChoices}
                className="text-kindle hover:text-rose-gold disabled:opacity-30"
              >
                {choices.length > 0 ? "Show Choices" : "Continue"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <Sheet open={showSettings} onOpenChange={setShowSettings}>
        <SheetContent side="right">
          <SheetHeader>
            <SheetTitle>Typography Settings</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <TypographySettings 
              isOpen={showSettings}
              onClose={() => setShowSettings(false)} 
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showBookmarks} onOpenChange={setShowBookmarks}>
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