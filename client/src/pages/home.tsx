import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, Gem, Moon, Sun, GitBranch } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme-provider";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import BottomNavigation from "@/components/bottom-navigation";
import FloatingCreateButton from "@/components/floating-create-button";
import { StoryCard } from "@/components/story-card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Story } from "@shared/schema";
import { isAdmin, isMegaAdmin } from "@shared/userRoles";

export default function Home() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  const [, setLocation] = useLocation();
  const [activeFilter, setActiveFilter] = useState("all");

  const { data: featuredStory } = useQuery<Story>({
    queryKey: ["/api/stories/featured"],
  });

  const { data: stories = [] } = useQuery<Story[]>({
    queryKey: ["/api/stories", activeFilter !== "all" ? `?category=${activeFilter}` : ""],
  });

  // Fetch reading progress for authenticated users
  const { data: readingProgress = [] } = useQuery<any[]>({
    queryKey: ["/api/reading-progress"],
    enabled: !!user,
  });

  // For guests, check localStorage for progress
  const getGuestProgress = (storyId: string) => {
    if (!user) {
      const savedPage = localStorage.getItem(`story-${storyId}-page`);
      return savedPage && parseInt(savedPage) > 1;
    }
    return false;
  };

  const getSpiceEmoji = (level: number) => {
    return "🌶️".repeat(level);
  };

  const openStory = (storyId: string) => {
    setLocation(`/story/${storyId}`);
  };

  // Start from beginning mutation - works for both authenticated and guest users
  const startFromBeginningMutation = useMutation({
    mutationFn: async (storyId: string) => {
      // For authenticated users, use API endpoint
      if (user) {
        const response = await apiRequest("POST", `/api/stories/${storyId}/start-from-beginning`);
        return await response.json();
      } else {
        // For guests, clear localStorage and navigate directly
        localStorage.removeItem(`story-${storyId}-page`);
        return { success: true };
      }
    },
    onSuccess: (data, storyId) => {
      toast({
        title: "Story Reset",
        description: "Starting fresh from the beginning!",
        duration: 1500,
      });
      // Navigate to the story
      setLocation(`/story/${storyId}`);
      
      // Refresh reading progress and user data for authenticated users
      if (user) {
        queryClient.invalidateQueries({ queryKey: ["/api/reading-progress"] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to reset story. Please try again.",
        variant: "destructive",
      });
    },
  });

  const openStoryFromBeginning = (storyId: string) => {
    startFromBeginningMutation.mutate(storyId);
  };



  const filterButtons = [
    { key: "all", label: "All" },
    { key: "straight", label: "Straight" },
    { key: "lgbt", label: "LGBT" },
  ];

  return (
    <div className="max-w-md mx-auto bg-dark-primary min-h-screen relative pb-20">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-dark-primary/95 backdrop-blur-sm border-b border-dark-tertiary">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 gradient-rose-gold rounded-lg flex items-center justify-center">
              <BookOpen className="text-dark-primary text-sm" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-text-primary">WildBranch</h1>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {user && isAdmin(user) ? (
              <Button
                onClick={() => setLocation("/story-builder")}
                size="sm"
                className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90 font-semibold"
              >
                Create Story
              </Button>
            ) : null}
            {user ? (
              <button 
                onClick={() => setLocation("/store")}
                className="flex items-center space-x-1 bg-dark-tertiary px-3 py-1.5 rounded-full hover:bg-dark-tertiary/80 transition-colors cursor-pointer"
              >
                <span className="text-lg">🍆</span>
                <span className="text-sm font-medium text-text-primary">
                  {(user as any)?.eggplants || 0}
                </span>
              </button>
            ) : (
              <Button
                onClick={() => window.location.href = "/api/login"}
                className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90 font-semibold text-sm px-4 py-1.5 h-8"
              >
                Sign In
              </Button>
            )}
            <button 
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full bg-dark-tertiary flex items-center justify-center hover:bg-dark-quaternary transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="text-text-muted" size={14} />
              ) : (
                <Moon className="text-text-muted" size={14} />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Quality Badge Strip */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-rose-gold py-2.5 shadow-sm">
        <div className="flex items-center justify-center gap-2">
          <span className="text-[10px] font-black tracking-widest text-white uppercase" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontStretch: 'condensed' }}>
            100% HUMAN
          </span>
          <span className="text-[10px] font-light tracking-wide text-white/90 uppercase">
            WRITTEN EROTICA
          </span>
          <span className="text-xs opacity-90 ml-1">✍️</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6">
        {/* Featured Story */}
        {featuredStory && (
          <section 
            className="relative rounded-2xl overflow-hidden gradient-dark cursor-pointer"
            onClick={() => openStory(featuredStory.id)}
          >
            <div 
              className="absolute inset-0 bg-cover opacity-80"
              style={{ 
                backgroundImage: `url(${featuredStory.imageUrl})`,
                backgroundPosition: 'center 60%' // Show lower portion of the image
              }}
            />
            <div className="relative p-6 min-h-96 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/40 via-transparent to-transparent">
              <div className="space-y-2">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="px-2 py-1 bg-rose-gold/20 text-rose-gold text-xs rounded-full border border-rose-gold/30">
                    FEATURED
                  </span>
                  <div className="flex items-center">
                    <span className="text-lg">{getSpiceEmoji(featuredStory.spiceLevel)}</span>
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white leading-tight">
                  {featuredStory.title}
                </h2>
                <p className="text-gray-200 text-sm leading-relaxed">
                  {featuredStory.description}
                </p>
                <div className="flex items-center space-x-4 text-xs text-gray-300 mt-3">
                  <span className="text-rose-gold font-medium">
                    {featuredStory.wordCount.toLocaleString()} words
                  </span>
                  <div className="flex items-center space-x-1">
                    <GitBranch className="text-gold-accent" size={12} />
                    <span className="text-gold-accent font-medium">
                      {featuredStory.pathCount} paths
                    </span>
                  </div>
                </div>
                
                {/* Button section */}
                <div className="space-y-2 mt-4">
                  <button 
                    className="w-full gradient-rose-gold text-dark-primary font-semibold py-3 rounded-xl transition-all duration-200 active:scale-95"
                    onClick={(e) => {
                      e.stopPropagation();
                      openStory(featuredStory.id);
                    }}
                  >
                    {(() => {
                      const featuredAuthProgress = readingProgress.find((p: any) => p.storyId === featuredStory.id);
                      const featuredGuestProgress = getGuestProgress(featuredStory.id);
                      const hasFeaturedProgress = featuredAuthProgress || featuredGuestProgress;
                      return hasFeaturedProgress ? "Continue Reading" : "Start Reading";
                    })()}
                  </button>
                  
                  {/* ALWAYS show Start from Beginning button */}
                  <button 
                    className="w-full bg-black/50 text-white font-medium py-2 text-sm rounded-lg border border-white/20 hover:border-rose-gold/50 hover:text-rose-gold transition-all duration-200 active:scale-95"
                    onClick={(e) => {
                      e.stopPropagation();
                      openStoryFromBeginning(featuredStory.id);
                    }}
                    disabled={startFromBeginningMutation.isPending}
                  >
                    {startFromBeginningMutation.isPending ? "Starting..." : "Start from Beginning"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Filter Tabs */}
        <section className="flex bg-dark-secondary rounded-xl p-1">
          {filterButtons.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm transition-all ${
                activeFilter === filter.key
                  ? "bg-rose-gold text-dark-primary"
                  : "text-text-muted hover:text-text-secondary"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </section>

        {/* Admin Create Story Section */}
        {user && isAdmin(user) && (
          <section className="p-4 bg-dark-secondary/50 rounded-xl border border-dark-tertiary/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">
                  {isMegaAdmin(user) ? "Mega-Admin" : "Writer"}: Create Story
                </h3>
                <p className="text-xs text-text-muted mt-1">Visual story editor for creators</p>
              </div>
              <Button
                onClick={() => setLocation("/story-builder")}
                className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90 text-sm px-4 py-2 h-8"
              >
                ✍️ Manage Stories
              </Button>
            </div>
          </section>
        )}

        {/* User Management Section - Mega-Admin Only */}
        {user && isMegaAdmin(user) && (
          <section className="p-4 bg-purple-500/20 rounded-xl border border-purple-500/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-text-primary">User Management</h3>
                <p className="text-xs text-text-muted mt-1">Promote users to admin writers</p>
              </div>
              <Button
                onClick={() => setLocation("/user-management")}
                variant="outline"
                className="text-purple-400 border-purple-500/50 hover:bg-purple-500/20 text-sm px-4 py-2 h-8"
              >
                👥 Manage
              </Button>
            </div>
          </section>
        )}

        {/* Story Grid */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-text-primary">Browse Stories</h3>
          
          <div className="space-y-4">
            {stories.map((story) => {
              // Get reading progress for this story (authenticated users)
              const storyProgress = readingProgress.find((p: any) => p.storyId === story.id);
              const hasAuthProgress = !!storyProgress;
              
              // Check guest progress from localStorage
              const hasGuestProgress = getGuestProgress(story.id);
              
              // Determine if any progress exists
              const hasProgress = hasAuthProgress || hasGuestProgress;
              
              // Calculate actual progress percentage (PAGE-BASED)
              let progressPercent = 0;
              if (hasProgress) {
                const totalPages = 10; // Stories have 10 pages each
                if (hasAuthProgress && storyProgress.pagesRead) {
                  // Use actual pages read for authenticated users
                  progressPercent = Math.round((storyProgress.pagesRead / totalPages) * 100);
                } else if (hasGuestProgress) {
                  // For guests, use saved page from localStorage
                  const savedPage = parseInt(localStorage.getItem(`story-${story.id}-page`) || "1");
                  progressPercent = Math.round((savedPage / totalPages) * 100);
                } else {
                  // Fallback - show minimal progress if we know user has started
                  progressPercent = Math.round((1 / totalPages) * 100);
                }
                // Ensure progress is between 1-99% (never 0% if hasProgress is true, never 100% unless completed)
                progressPercent = Math.max(1, Math.min(99, progressPercent));
              }
              
              return (
                <StoryCard
                  key={story.id}
                  story={story}
                  onRead={() => openStory(story.id)}
                  onReadFromBeginning={hasProgress ? () => openStoryFromBeginning(story.id) : () => {}}
                  showProgress={hasProgress || false}
                  progressPercent={progressPercent}
                />
              );
            })}
          </div>

          {stories.length === 0 && (
            <div className="text-center py-8">
              <p className="text-text-muted">No stories found in this category.</p>
            </div>
          )}
        </section>
      </main>

      <FloatingCreateButton />
      <BottomNavigation />
    </div>
  );
}
