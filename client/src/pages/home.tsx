import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Gem, Moon, Sun, GitBranch } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/components/theme-provider";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { BottomNavigation } from "@/components/bottom-navigation";
import { StoryCard } from "@/components/story-card";
import type { Story } from "@shared/schema";
import { isAdmin, isMegaAdmin, getUserPermissions } from "@shared/userRoles";

export default function Home() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  
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

  const getSpiceEmoji = (level: number) => {
    return "🌶️".repeat(level);
  };

  const openStory = (storyId: string) => {
    setLocation(`/story/${storyId}`);
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
            <h1 className="text-xl font-bold tracking-tight text-text-primary">TurnPage</h1>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <button 
                onClick={() => setLocation("/store")}
                className="flex items-center space-x-1 bg-dark-tertiary px-3 py-1.5 rounded-full hover:bg-dark-tertiary/80 transition-colors cursor-pointer"
              >
                <Gem className="text-gold-accent" size={14} />
                <span className="text-sm font-medium text-text-primary">
                  {(user as any)?.diamonds || 0}
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

      {/* Main Content */}
      <main className="px-4 py-6 space-y-6">
        {/* Featured Story */}
        {featuredStory && (
          <section 
            className="relative rounded-2xl overflow-hidden gradient-dark cursor-pointer"
            onClick={() => openStory(featuredStory.id)}
          >
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-60"
              style={{ backgroundImage: `url(${featuredStory.imageUrl})` }}
            />
            <div className="relative p-6 min-h-48 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/40 to-transparent">
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
                <button 
                  className="w-full mt-4 gradient-rose-gold text-dark-primary font-semibold py-3 rounded-xl transition-all duration-200 active:scale-95"
                  onClick={(e) => {
                    e.stopPropagation();
                    openStory(featuredStory.id);
                  }}
                >
                  {user ? "Continue Reading" : "Start Reading"}
                </button>
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
                onClick={() => setLocation("/story-creator")}
                className="bg-rose-gold text-dark-primary hover:bg-rose-gold/90 text-sm px-4 py-2 h-8"
              >
                ✍️ Create
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
            {stories.map((story) => (
              <StoryCard
                key={story.id}
                story={story}
                onRead={() => openStory(story.id)}
              />
            ))}
          </div>

          {stories.length === 0 && (
            <div className="text-center py-8">
              <p className="text-text-muted">No stories found in this category.</p>
            </div>
          )}
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}
