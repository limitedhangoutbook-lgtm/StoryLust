import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Book, 
  Clock, 
  Star, 
  TrendingUp, 
  Calendar,
  Bookmark,
  CheckCircle,
  Zap
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function ReadingAnalytics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/analytics/reading-stats"],
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-8 bg-muted rounded mb-2" />
                <div className="h-4 bg-muted rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Start reading to see your analytics!</p>
        </CardContent>
      </Card>
    );
  }

  const readingTimeHours = Math.floor(stats.totalReadingTimeMinutes / 60);
  const readingTimeMinutes = stats.totalReadingTimeMinutes % 60;

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Book className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalStoriesRead}</p>
                <p className="text-xs text-muted-foreground">Stories Read</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">
                  {readingTimeHours > 0 ? `${readingTimeHours}h` : `${readingTimeMinutes}m`}
                </p>
                <p className="text-xs text-muted-foreground">Reading Time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalChoicesMade}</p>
                <p className="text-xs text-muted-foreground">Choices Made</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">
                  {stats.totalStoriesRead > 0 
                    ? Math.round((stats.totalChoicesMade / stats.totalStoriesRead) * 10) / 10
                    : 0
                  }
                </p>
                <p className="text-xs text-muted-foreground">Avg Choices</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Favorite Genres */}
      {stats.favoriteGenres && stats.favoriteGenres.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Favorite Genres
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.favoriteGenres.map((genre: string, index: number) => (
                <Badge 
                  key={genre} 
                  variant={index === 0 ? "default" : "secondary"}
                  className="capitalize"
                >
                  {genre === "straight" ? "Heterosexual" : 
                   genre === "lgbt" ? "LGBTQ+" : 
                   genre}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity */}
      {stats.recentActivity && stats.recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Recent Reading Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.map((activity: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    {activity.isCompleted ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Bookmark className="h-4 w-4 text-blue-500" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{activity.storyTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.isCompleted ? "Completed" : "In Progress"}
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.lastReadAt), { addSuffix: true })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reading Milestones */}
      <Card>
        <CardHeader>
          <CardTitle>Reading Milestones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Stories Explorer</span>
              <span>{stats.totalStoriesRead}/10</span>
            </div>
            <Progress value={Math.min((stats.totalStoriesRead / 10) * 100, 100)} />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Choice Master</span>
              <span>{stats.totalChoicesMade}/100</span>
            </div>
            <Progress value={Math.min((stats.totalChoicesMade / 100) * 100, 100)} />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Reading Time Champion</span>
              <span>{stats.totalReadingTimeMinutes}/1000 minutes</span>
            </div>
            <Progress value={Math.min((stats.totalReadingTimeMinutes / 1000) * 100, 100)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}