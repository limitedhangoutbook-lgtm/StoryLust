import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Home } from "lucide-react";

export default function StoryReaderSimple() {
  const [match, params] = useRoute("/story/:storyId");
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Simple state
  const [currentNodeId, setCurrentNodeId] = useState<string>("");
  const [history, setHistory] = useState<string[]>([]);
  
  const storyId = params?.storyId;

  // Get story
  const { data: story } = useQuery({
    queryKey: [`/api/stories/${storyId}`],
    enabled: !!storyId,
  });

  // Get current node
  const { data: currentNode } = useQuery({
    queryKey: [`/api/nodes/${currentNodeId}`],
    enabled: !!currentNodeId,
  });

  // Get choices
  const { data: choices = [] } = useQuery({
    queryKey: [`/api/nodes/${currentNodeId}/choices`],
    enabled: !!currentNodeId,
  });

  // Get progress
  const { data: progress } = useQuery({
    queryKey: [`/api/reading-progress/${storyId}`],
    enabled: !!storyId && isAuthenticated,
  });

  // Initialize starting node
  useEffect(() => {
    if (!storyId) return;
    
    // Get from progress, localStorage, or use starting node
    const savedNodeId = localStorage.getItem(`story-${storyId}-node`);
    let startNodeId;
    
    if (storyId === 'desert-seduction') {
      startNodeId = 'desert-start';
    } else if (storyId === 'campus-encounter') {
      startNodeId = 'start';
    } else {
      startNodeId = 'start'; // default
    }
    
    const nodeId = progress?.currentNodeId || savedNodeId || startNodeId;
    setCurrentNodeId(nodeId);
  }, [storyId, progress]);

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
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [history.length]);

  // Go back
  const goBack = () => {
    if (history.length === 0) return;
    
    const previousNodeId = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setCurrentNodeId(previousNodeId);
    
    // Save progress
    localStorage.setItem(`story-${storyId}-node`, previousNodeId);
    if (isAuthenticated && storyId) {
      apiRequest("POST", "/api/reading-progress", {
        storyId,
        currentNodeId: previousNodeId,
        isBookmarked: false,
      }).catch(() => {});
    }
  };

  // Select choice
  const selectChoiceMutation = useMutation({
    mutationFn: async (choiceId: string) => {
      const response = await apiRequest("POST", `/api/choices/${choiceId}/select`, {
        storyId,
        currentNodeId,
      });
      return response.json();
    },
    onSuccess: (data, choiceId) => {
      if (data.targetNode?.id) {
        // Add current node to history
        setHistory(prev => [...prev, currentNodeId]);
        
        // Navigate to new node
        setCurrentNodeId(data.targetNode.id);
        
        // Save progress
        localStorage.setItem(`story-${storyId}-node`, data.targetNode.id);
        if (isAuthenticated && storyId) {
          apiRequest("POST", "/api/reading-progress", {
            storyId,
            currentNodeId: data.targetNode.id,
            isBookmarked: false,
          }).catch(() => {});
        }
        
        // Show feedback
        const choice = choices.find(c => c.id === choiceId);
        toast({
          title: choice?.isPremium ? "🍆✨ Premium Choice Made! ✨🍆" : "✨ Choice Made! ✨",
          description: "Your story continues...",
          duration: 1500,
        });
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // Reset story
  const resetMutation = useMutation({
    mutationFn: async () => {
      if (isAuthenticated) {
        await apiRequest("DELETE", `/api/reading-progress/${storyId}`);
      }
      localStorage.removeItem(`story-${storyId}-node`);
    },
    onSuccess: () => {
      let startNodeId;
      if (storyId === 'desert-seduction') {
        startNodeId = 'desert-start';
      } else if (storyId === 'campus-encounter') {
        startNodeId = 'start';
      } else {
        startNodeId = 'start';
      }
      
      setCurrentNodeId(startNodeId);
      setHistory([]);
      queryClient.invalidateQueries({ queryKey: [`/api/reading-progress/${storyId}`] });
    },
  });

  // Check if story is ending
  const isEnding = currentNode?.content?.includes("**THE END**") || false;

  if (!story || !currentNode) {
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
        <div className="flex items-center justify-between px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/")}
            className="text-kindle-secondary hover:text-kindle"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Home
          </Button>
          
          <h1 className="text-lg font-semibold text-kindle truncate max-w-xs">
            {story.title}
          </h1>
          
          <div className="w-20" /> {/* Spacer for center alignment */}
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-20 px-6 max-w-3xl mx-auto pb-32">
        {/* Swipe hint for first-time users */}
        {currentNodeId.includes("start") && (
          <div className="text-center mb-6 text-kindle-secondary text-sm">
            💡 Swipe right to go back to previous choices
          </div>
        )}
        
        {/* Story Content */}
        <div className="kindle-text text-kindle space-y-6 mb-8">
          {currentNode.content.split('\n\n').map((paragraph, index) => (
            <p key={index} className="kindle-paragraph leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Choices */}
        {choices.length > 0 && !isEnding && (
          <div className="space-y-4 mb-8">
            <h3 className="text-lg font-semibold text-kindle mb-4">What do you do?</h3>
            {choices.map((choice, index) => (
              <button
                key={choice.id}
                onClick={() => selectChoiceMutation.mutate(choice.id)}
                disabled={selectChoiceMutation.isPending}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  choice.isPremium 
                    ? 'border-rose-gold/30 hover:border-rose-gold hover:bg-rose-gold/5' 
                    : 'border-dark-tertiary hover:border-kindle-secondary hover:bg-dark-secondary/30'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <span className={`font-bold text-lg ${choice.isPremium ? 'text-rose-gold' : 'text-kindle-secondary'}`}>
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <div className="flex-1">
                    <span className="text-base">
                      {choice.choiceText}
                    </span>
                    {choice.isPremium && (
                      <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-rose-gold/15 text-rose-gold border border-rose-gold/30 rounded-full text-sm font-semibold">
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

      {/* Bottom Navigation */}
      {!isEnding && (
        <div className="fixed bottom-0 left-0 right-0 bg-kindle/95 backdrop-blur-sm border-t border-dark-tertiary/30">
          <div className="flex items-center justify-between px-6 py-4 max-w-3xl mx-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={goBack}
              disabled={history.length === 0}
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
            
            <div className="text-sm text-kindle-secondary">
              {choices.length > 0 ? `${choices.length} choices` : "Continue"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}