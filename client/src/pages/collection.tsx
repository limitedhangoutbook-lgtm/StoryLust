import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Sparkles, Trophy, Crown, Lock, Home } from "lucide-react";
import { Link } from "wouter";

const rarityConfig = {
  ember: {
    bg: "bg-gradient-to-br from-rose-300/60 via-rose-400/50 to-rose-600/40", 
    border: "border-rose-400",
    icon: Sparkles,
    text: "text-rose-200",
    accent: "text-rose-300",
    name: "Ember"
  },
  flame: {
    bg: "bg-gradient-to-br from-yellow-200 via-yellow-400 to-amber-500",
    border: "border-amber-400", 
    icon: Trophy,
    text: "text-amber-200",
    accent: "text-amber-300",
    name: "Flame"
  },
  inferno: {
    bg: "bg-gradient-to-br from-yellow-100 via-amber-300 to-orange-400",
    border: "border-yellow-400",
    icon: Crown,
    text: "text-yellow-100",
    accent: "text-yellow-200",
    name: "Inferno"
  }
};

export default function Collection() {
  const { user, isAuthenticated } = useAuth();

  // Get user's collection
  const { data, isLoading } = useQuery({
    queryKey: ['/api/ending-cards/collection'],
    enabled: isAuthenticated,
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-kindle flex items-center justify-center p-4">
        <div className="text-center space-y-6">
          <div className="w-24 h-24 mx-auto rounded-full bg-kindle-secondary/20 flex items-center justify-center">
            <Lock className="w-12 h-12 text-kindle-secondary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-kindle mb-2">Collection Locked</h1>
            <p className="text-kindle-secondary">
              Sign in to collect and view your ending cards
            </p>
          </div>
          <Link href="/api/login">
            <Button className="bg-rose-gold hover:bg-rose-gold-dark text-white">
              Sign In to Unlock
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-kindle flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-rose-gold border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-kindle-secondary">Loading your collection...</p>
        </div>
      </div>
    );
  }

  const collection = data || { cards: [], stats: { totalCards: 0, cardsByRarity: { ember: 0, flame: 0, inferno: 0 }, completedStories: 0, newCardsCount: 0 } };
  const { cards, stats } = collection;

  return (
    <div className="min-h-screen bg-kindle p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-kindle mb-2">Your Collection</h1>
            <p className="text-kindle-secondary">
              {stats.totalCards} cards collected • {stats.completedStories} stories completed
            </p>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm">
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>

        {/* Collection Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {Object.entries(stats.cardsByRarity || {}).map(([rarity, count]) => {
            const config = rarityConfig[rarity as keyof typeof rarityConfig];
            const Icon = config.icon;
            
            return (
              <Card key={rarity} className="p-4 text-center bg-white/5 backdrop-blur-sm border-white/10">
                <Icon className={`w-6 h-6 mx-auto mb-2 ${config.text}`} />
                <div className="text-2xl font-bold text-kindle">{count}</div>
                <div className="text-xs text-kindle-secondary uppercase tracking-wide">
                  {config?.name || (rarity as string)}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Cards Grid */}
        {cards.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto rounded-full bg-kindle-secondary/10 flex items-center justify-center mb-6">
              <Star className="w-12 h-12 text-kindle-secondary" />
            </div>
            <h3 className="text-xl font-semibold text-kindle mb-2">No Cards Yet</h3>
            <p className="text-kindle-secondary mb-6">
              Complete story paths to collect ending cards
            </p>
            <Link href="/">
              <Button className="bg-rose-gold hover:bg-rose-gold-dark text-white">
                Start Reading
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card: any) => {
              const config = rarityConfig[card.rarity as keyof typeof rarityConfig] || rarityConfig.ember;
              const Icon = config.icon;
              
              return (
                <Card
                  key={card.id}
                  className={`relative overflow-hidden border-2 ${config.bg} ${config.border} shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
                >
                  <div className="p-6 space-y-4">
                    {/* Rarity Badge */}
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant="outline" 
                        className={`border-white/30 ${config.text} bg-white/10`}
                      >
                        <Icon className="w-3 h-3 mr-1" />
                        {config.name.toUpperCase()}
                      </Badge>
                      {card.isNewCard && (
                        <Badge className="bg-red-500 text-white text-xs">
                          NEW!
                        </Badge>
                      )}
                    </div>

                    {/* Card Visual */}
                    <div className="text-center">
                      {card.cardImageUrl ? (
                        <div className="w-16 h-16 mx-auto rounded-full overflow-hidden bg-white/10 mb-3">
                          <img 
                            src={card.cardImageUrl} 
                            alt={card.cardTitle}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 mx-auto rounded-full bg-white/10 flex items-center justify-center mb-3">
                          <Icon className={`w-8 h-8 ${config.text}`} />
                        </div>
                      )}

                      <h3 className="font-bold text-white text-lg mb-1">
                        {card.cardTitle}
                      </h3>
                      
                      {card.cardSubtitle && (
                        <p className={`text-sm ${config.text} mb-2`}>
                          {card.cardSubtitle}
                        </p>
                      )}
                    </div>

                    {/* Card Description */}
                    <p className="text-sm text-white/80 leading-relaxed">
                      {card.cardDescription}
                    </p>

                    {/* Story Source & Tags */}
                    <div className="space-y-2">
                      <div className="text-xs text-white/60">
                        From: {card.storyTitle}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {card.emotionTag && (
                          <Badge variant="outline" className="text-xs border-white/20 text-white/70">
                            {card.emotionTag}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs border-white/20 text-white/60">
                          {new Date(card.unlockedAt).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}