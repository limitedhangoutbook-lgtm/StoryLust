import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Heart, Clock, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { BottomNavigation } from "@/components/bottom-navigation";
import { StoryCard } from "@/components/story-card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { ReadingProgress, Story } from "@shared/schema";

type ReadingProgressWithStory = ReadingProgress & {
  story: Story;
};

export default function MyReading() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"continue" | "bookmarked">("continue");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Show sign-in prompt for unauthenticated users
  if (!authLoading && !user) {
    return (
      <div className="max-w-md mx-auto bg-dark-primary min-h-screen flex flex-col items-center justify-center p-6 space-y-6">
        <div className="text-center space-y-4">
          <BookOpen className="w-16 h-16 text-rose-gold mx-auto" />
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Sign In Required</h2>
            <p className="text-text-muted leading-relaxed">
              Sign in to view your reading progress and continue your stories where you left off.
            </p>
          </div>
        </div>
        <div className="flex flex-col space-y-3 w-full max-w-xs">
          <Button
            onClick={() => window.location.href = "/api/login"}
            className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90 font-semibold"
          >
            Sign In
          </Button>
          <Button
            onClick={() => setLocation("/")}
            variant="outline"
            className="border-dark-tertiary text-text-secondary hover:bg-dark-tertiary"
          >
            Back to Browse
          </Button>
        </div>
      </div>
    );
  }

  // Fetch reading progress
  const { data: readingProgress = [], isLoading } = useQuery<ReadingProgressWithStory[]>({
    queryKey: ["/api/reading-progress"],
    enabled: !!user,
  });

  // Toggle bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: async (storyId: string) => {
      return await apiRequest("POST", `/api/stories/${storyId}/bookmark`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reading-progress"] });
      toast({
        title: "Bookmark Updated",
        description: "Your reading list has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update bookmark.",
        variant: "destructive",
      });
    },
  });

  const openStory = (storyId: string) => {
    setLocation(`/story/${storyId}`);
  };

  const handleBookmark = (storyId: string) => {
    bookmarkMutation.mutate(storyId);
  };

  const continueReading = readingProgress.filter(p => !p.isBookmarked);
  const bookmarked = readingProgress.filter(p => p.isBookmarked);

  const currentList = activeTab === "continue" ? continueReading : bookmarked;

  return (
    <div className="max-w-md mx-auto bg-dark-primary min-h-screen relative pb-20">
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
            <h1 className="text-xl font-bold tracking-tight text-text-primary">My Reading</h1>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="px-4 py-4">
        <div className="flex bg-dark-secondary rounded-xl p-1">
          <button
            onClick={() => setActiveTab("continue")}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center space-x-2 ${
              activeTab === "continue"
                ? "bg-rose-gold text-dark-primary"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            <BookOpen size={16} />
            <span>Continue Reading</span>
            {continueReading.length > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === "continue" 
                  ? "bg-dark-primary/20" 
                  : "bg-rose-gold/20 text-rose-gold"
              }`}>
                {continueReading.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("bookmarked")}
            className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all flex items-center justify-center space-x-2 ${
              activeTab === "bookmarked"
                ? "bg-rose-gold text-dark-primary"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            <Heart size={16} />
            <span>Bookmarked</span>
            {bookmarked.length > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === "bookmarked" 
                  ? "bg-dark-primary/20" 
                  : "bg-rose-gold/20 text-rose-gold"
              }`}>
                {bookmarked.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="px-4 space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-dark-secondary rounded-xl p-4 animate-pulse">
                <div className="aspect-[16/9] bg-dark-tertiary rounded-lg mb-4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-dark-tertiary rounded w-3/4"></div>
                  <div className="h-3 bg-dark-tertiary rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        ) : currentList.length > 0 ? (
          <div className="space-y-4">
            {currentList.map((progress) => (
              <StoryCard
                key={progress.id}
                story={progress.story}
                onRead={() => openStory(progress.storyId)}
                onBookmark={() => handleBookmark(progress.storyId)}
                showProgress={true}
                progressPercent={Math.min(100, (progress.currentNodeId ? 50 : 10))}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-dark-secondary rounded-2xl flex items-center justify-center mx-auto mb-4">
              {activeTab === "continue" ? (
                <BookOpen className="w-8 h-8 text-text-muted" />
              ) : (
                <Heart className="w-8 h-8 text-text-muted" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              {activeTab === "continue" ? "No Stories in Progress" : "No Bookmarked Stories"}
            </h3>
            <p className="text-text-muted mb-6 max-w-xs mx-auto">
              {activeTab === "continue" 
                ? "Start reading stories to see your progress here."
                : "Bookmark stories you want to read later."}
            </p>
            <Button 
              onClick={() => setLocation("/")}
              className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90"
            >
              Browse Stories
            </Button>
          </div>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}