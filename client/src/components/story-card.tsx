import { BookOpen, GitBranch, Heart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Story } from "@shared/schema";

interface StoryCardProps {
  story: Story;
  onRead: (storyId: string) => void;
  onReadFromBeginning?: (storyId: string) => void;
  onBookmark?: (storyId: string) => void;
  showProgress?: boolean;
  progressPercent?: number;
  className?: string;
}

export function StoryCard({ 
  story, 
  onRead, 
  onReadFromBeginning,
  onBookmark, 
  showProgress, 
  progressPercent,
  className = ""
}: StoryCardProps) {
  const getSpiceEmoji = (level: number) => {
    return "🌶️".repeat(level);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "straight":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "lgbt":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  return (
    <Card className={`bg-dark-secondary border-dark-tertiary hover:border-rose-gold/30 transition-all duration-200 ${className}`}>
      <CardContent className="p-0">
        <div className="relative">
          {/* Story Image */}
          <div className="aspect-[16/9] overflow-hidden rounded-t-lg">
            {story.imageUrl ? (
              <img 
                src={story.imageUrl} 
                alt={story.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-rose-gold/20 to-gold-accent/20 flex items-center justify-center">
                <BookOpen className="w-12 h-12 text-rose-gold/60" />
              </div>
            )}
          </div>

          {/* Progress Bar */}
          {showProgress && progressPercent !== undefined && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
              <div 
                className="h-full bg-rose-gold transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          {/* Bookmark Button */}
          {onBookmark && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onBookmark(story.id);
              }}
              className="absolute top-2 right-2 w-8 h-8 p-0 bg-black/50 hover:bg-black/70 backdrop-blur-sm"
            >
              <Heart className="w-4 h-4 text-white" />
            </Button>
          )}
        </div>

        {/* Story Info */}
        <div className="p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-text-primary leading-tight mb-1 line-clamp-2">
                {story.title}
              </h3>
              <p className="text-sm text-text-muted leading-relaxed line-clamp-2">
                {story.description}
              </p>
            </div>
          </div>

          {/* Tags and Metadata */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-1 text-xs rounded-full border ${getCategoryColor(story.category)}`}>
                {story.category.toUpperCase()}
              </span>
              <div className="flex items-center">
                <span className="text-sm">{getSpiceEmoji(story.spiceLevel)}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 text-xs text-text-muted">
              <div className="flex items-center space-x-1">
                <BookOpen className="w-3 h-3" />
                <span>{story.wordCount.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <GitBranch className="w-3 h-3" />
                <span>{story.pathCount}</span>
              </div>
            </div>
          </div>

          {/* Read Buttons */}
          <div className="space-y-2">
            <Button
              onClick={() => onRead(story.id)}
              className="w-full bg-rose-gold text-dark-primary hover:bg-rose-gold/90 font-semibold"
            >
              {showProgress && progressPercent ? "Continue Reading" : "Start Reading"}
            </Button>
            
            {/* Read from Beginning button - only show when user has progress */}
            {showProgress && progressPercent && progressPercent > 0 && onReadFromBeginning && (
              <Button
                onClick={() => onReadFromBeginning(story.id)}
                variant="outline"
                className="w-full text-xs text-text-muted border-dark-tertiary hover:border-rose-gold/30 hover:text-rose-gold py-1.5 h-auto"
              >
                Read from Beginning
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}