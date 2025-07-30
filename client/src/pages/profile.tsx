import { ArrowLeft, LogOut, Gem, BookOpen, Heart, User, Settings, Plus, Edit } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { BottomNavigation } from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { isAdmin, isMegaAdmin } from "@shared/userRoles";

export default function Profile() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Show sign-in prompt for unauthenticated users
  if (!isLoading && !user) {
    return (
      <div className="max-w-md mx-auto bg-dark-primary min-h-screen flex flex-col items-center justify-center p-6 space-y-6">
        <div className="text-center space-y-4">
          <User className="w-16 h-16 text-rose-gold mx-auto" />
          <div>
            <h2 className="text-2xl font-bold text-text-primary mb-2">Sign In Required</h2>
            <p className="text-text-muted leading-relaxed">
              Sign in to view your profile, reading stats, and manage your account settings.
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

  // Fetch real user stats
  const { data: userStats = {
    storiesStarted: 0,
    storiesCompleted: 0,
    totalChoicesMade: 0,
    bookmarkedStories: 0,
    premiumChoicesUnlocked: 0,
    diamondsSpent: 0,
  }, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/user/stats"],
    enabled: !!user,
  });

  // Fetch reading progress for recent activity
  const { data: readingProgress = [] } = useQuery({
    queryKey: ["/api/reading-progress"],
    enabled: !!user,
  });

  // Fetch bookmarks
  const { data: bookmarks = [] } = useQuery({
    queryKey: ["/api/bookmarks"],
    enabled: !!user,
  });

  const stats = userStats as any;

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

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
            <h1 className="text-xl font-bold tracking-tight text-text-primary">Profile</h1>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = "/api/logout"}
            className="h-8 w-8 p-0 hover:bg-dark-tertiary text-text-muted hover:text-rose-gold"
          >
            <LogOut size={16} />
          </Button>
        </div>
      </header>

      {/* Profile Info */}
      <main className="px-4 py-6 space-y-6">
        <Card className="bg-dark-secondary border-dark-tertiary">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16 ring-2 ring-rose-gold/20">
                <AvatarImage 
                  src={(user as any)?.profileImageUrl} 
                  alt="Profile" 
                  className="object-cover"
                />
                <AvatarFallback className="bg-gradient-rose-gold text-dark-primary font-bold text-lg">
                  {getInitials((user as any)?.firstName, (user as any)?.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-text-primary">
                  {(user as any)?.firstName && (user as any)?.lastName 
                    ? `${(user as any).firstName} ${(user as any).lastName}`
                    : "Anonymous Reader"}
                </h2>
                <p className="text-text-muted text-sm">
                  {(user as any)?.email || "No email provided"}
                </p>
                <div className="flex items-center space-x-1 mt-2">
                  <Gem className="text-gold-accent" size={14} />
                  <span className="text-sm font-medium text-gold-accent">
                    {(user as any)?.diamonds || 0} diamonds
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reading Stats */}
        <Card className="bg-dark-secondary border-dark-tertiary">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Reading Stats</h3>
            {statsLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="text-center p-4 bg-dark-tertiary rounded-lg animate-pulse">
                    <div className="w-6 h-6 bg-dark-primary rounded mx-auto mb-2" />
                    <div className="h-6 bg-dark-primary rounded mb-1" />
                    <div className="h-3 bg-dark-primary rounded w-3/4 mx-auto" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-dark-tertiary rounded-lg">
                    <BookOpen className="w-6 h-6 text-rose-gold mx-auto mb-2" />
                    <div className="text-2xl font-bold text-text-primary">{stats.storiesStarted || 0}</div>
                    <div className="text-xs text-text-muted">Stories Started</div>
                  </div>
                  <div className="text-center p-4 bg-dark-tertiary rounded-lg">
                    <Heart className="w-6 h-6 text-rose-gold mx-auto mb-2" />
                    <div className="text-2xl font-bold text-text-primary">{stats.bookmarkedStories || 0}</div>
                    <div className="text-xs text-text-muted">Bookmarked</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-dark-tertiary rounded-lg">
                    <Settings className="w-6 h-6 text-rose-gold mx-auto mb-2" />
                    <div className="text-2xl font-bold text-text-primary">{stats.storiesCompleted || 0}</div>
                    <div className="text-xs text-text-muted">Completed</div>
                  </div>
                  <div className="text-center p-4 bg-dark-tertiary rounded-lg">
                    <Gem className="w-6 h-6 text-gold-accent mx-auto mb-2" />
                    <div className="text-2xl font-bold text-text-primary">{stats.totalChoicesMade || 0}</div>
                    <div className="text-xs text-text-muted">Choices Made</div>
                  </div>
                </div>

                {/* Reading Progress Bars */}
                <div className="space-y-3 mt-6">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-secondary">Story Explorer</span>
                      <span className="text-text-primary">{stats.storiesStarted || 0}/10</span>
                    </div>
                    <Progress value={Math.min(((stats.storiesStarted || 0) / 10) * 100, 100)} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-secondary">Choice Master</span>
                      <span className="text-text-primary">{stats.totalChoicesMade || 0}/100</span>
                    </div>
                    <Progress value={Math.min(((stats.totalChoicesMade || 0) / 100) * 100, 100)} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-secondary">Story Finisher</span>
                      <span className="text-text-primary">{stats.storiesCompleted || 0}/5</span>
                    </div>
                    <Progress value={Math.min(((stats.storiesCompleted || 0) / 5) * 100, 100)} className="h-2" />
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-dark-secondary border-dark-tertiary">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button
                variant="ghost"
                className="w-full justify-start text-text-primary hover:bg-dark-tertiary"
                onClick={() => setLocation("/my-reading")}
              >
                <BookOpen className="w-4 h-4 mr-3" />
                My Reading
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start text-text-primary hover:bg-dark-tertiary"
                onClick={() => setLocation("/store")}
              >
                <Gem className="w-4 h-4 mr-3 text-gold-accent" />
                Get More Diamonds
              </Button>
              
              {/* Admin Actions */}
              {user && isAdmin(user) && (
                <>
                  <Separator className="bg-dark-tertiary" />
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-rose-gold hover:bg-dark-tertiary"
                    onClick={() => setLocation("/story-builder")}
                  >
                    <Plus className="w-4 h-4 mr-3" />
                    Create New Story
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-rose-gold hover:bg-dark-tertiary"
                    onClick={() => setLocation("/story-management")}
                  >
                    <Edit className="w-4 h-4 mr-3" />
                    Manage My Stories
                  </Button>
                </>
              )}
              
              {/* Mega Admin Actions */}
              {user && isMegaAdmin(user) && (
                <Button
                  variant="ghost"
                  className="w-full justify-start text-gold-accent hover:bg-dark-tertiary"
                  onClick={() => setLocation("/user-management")}
                >
                  <Settings className="w-4 h-4 mr-3" />
                  User Management
                </Button>
              )}
              
              <Separator className="bg-dark-tertiary" />
              <Button
                variant="ghost"
                className="w-full justify-start text-text-muted hover:bg-dark-tertiary hover:text-rose-gold"
                onClick={() => window.location.href = "/api/logout"}
              >
                <LogOut className="w-4 h-4 mr-3" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Reading Activity */}
        {Array.isArray(readingProgress) && readingProgress.length > 0 && (
          <Card className="bg-dark-secondary border-dark-tertiary">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {readingProgress.slice(0, 3).map((progress: any) => (
                  <div key={progress.id} className="flex items-center space-x-3 p-3 bg-dark-tertiary rounded-lg">
                    <div className="w-10 h-10 bg-gradient-rose-gold rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-dark-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {progress.story?.title || "Unknown Story"}
                      </p>
                      <p className="text-xs text-text-muted">
                        {progress.isCompleted 
                          ? "✓ Completed" 
                          : `${progress.pagesRead || 0} pages read`}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocation(`/story/${progress.storyId}`)}
                      className="text-rose-gold hover:bg-rose-gold/10 text-xs px-2 py-1 h-auto"
                    >
                      {progress.isCompleted ? "Read Again" : "Continue"}
                    </Button>
                  </div>
                ))}
                
                {readingProgress.length > 3 && (
                  <Button
                    variant="ghost"
                    className="w-full text-sm text-text-muted hover:text-text-primary"
                    onClick={() => setLocation("/my-reading")}
                  >
                    View all reading progress →
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* App Info */}
        <Card className="bg-dark-secondary border-dark-tertiary">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 gradient-rose-gold rounded-2xl flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6 text-dark-primary" />
              </div>
              <h4 className="font-semibold text-text-primary">TurnPage</h4>
              <p className="text-xs text-text-muted">
                Choose your own adventure stories
              </p>
              <p className="text-xs text-text-muted">
                Version 1.0.0 • Made with ❤️
              </p>
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  );
}