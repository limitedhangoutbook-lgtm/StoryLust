import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Heart, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Story } from "@shared/schema";

interface StoryCardProps {
  story: Story;
  onRead: (storyId: string) => void;
  onBookmark?: (storyId: string) => void;
  isBookmarked?: boolean;
  showProgress?: boolean;
  progressText?: string;
  className?: string;
}

const spiceLevelText = {
  1: "Mild",
  2: "Medium", 
  3: "Hot",
};

const categoryColors = {
  straight: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  lgbt: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  all: "bg-green-500/20 text-green-300 border-green-500/30",
};

export function StoryCard({ 
  story, 
  onRead, 
  onBookmark, 
  isBookmarked = false,
  showProgress = false,
  progressText,
  className 
}: StoryCardProps) {
  const spiceLevel = story.spiceLevel as 1 | 2 | 3;
  const category = story.category as keyof typeof categoryColors;

  return (
    <Card className={cn(
      "bg-dark-secondary border-dark-tertiary hover:border-rose-gold/30 transition-all duration-200 overflow-hidden",
      className
    )}>
      <div className="relative">
        <div 
          className="aspect-[16/9] bg-gradient-dark bg-cover bg-center relative"
          style={{ 
            backgroundImage: story.imageUrl ? `url(${story.imageUrl})` : undefined
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-dark-primary/80 via-transparent to-transparent" />
          
          {/* Category and Spice Level badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge variant="secondary" className={categoryColors[category]}>
              {story.category.toUpperCase()}
            </Badge>
            <Badge variant="secondary" className="bg-rose-gold/20 text-rose-gold border-rose-gold/30">
              <span className={`spice-${spiceLevel} mr-1`}></span>
              {spiceLevelText[spiceLevel]}
            </Badge>
          </div>

          {/* Bookmark button */}
          {onBookmark && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-3 right-3 h-8 w-8 p-0 bg-dark-primary/60 hover:bg-dark-primary/80"
              onClick={(e) => {
                e.stopPropagation();
                onBookmark(story.id);
              }}
            >
              <Heart 
                size={16} 
                className={isBookmarked ? "fill-rose-gold text-rose-gold" : "text-text-muted"} 
              />
            </Button>
          )}

          {/* Featured indicator */}
          {story.isFeatured && (
            <div className="absolute top-3 right-12 bg-gold-accent text-dark-primary px-2 py-1 rounded text-xs font-bold">
              FEATURED
            </div>
          )}
        </div>
        
        <CardContent className="p-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-bold text-lg text-text-primary leading-tight line-clamp-2">
                {story.title}
              </h3>
              <p className="text-text-muted text-sm mt-1 line-clamp-2">
                {story.description}
              </p>
            </div>

            {/* Story Stats */}
            <div className="flex items-center gap-4 text-xs text-text-muted">
              <div className="flex items-center gap-1">
                <Clock size={12} />
                <span>{story.wordCount.toLocaleString()} words</span>
              </div>
              <div className="flex items-center gap-1">
                <BookOpen size={12} />
                <span>{story.pathCount} paths</span>
              </div>
            </div>

            {/* Progress indicator */}
            {showProgress && progressText && (
              <div className="bg-dark-tertiary rounded p-2">
                <p className="text-xs text-text-secondary">{progressText}</p>
              </div>
            )}

            {/* Read button */}
            <Button 
              onClick={() => onRead(story.id)}
              className="w-full bg-rose-gold text-dark-primary hover:bg-rose-gold/90 font-semibold"
            >
              {showProgress ? "Continue Reading" : "Start Reading"}
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
  );
}