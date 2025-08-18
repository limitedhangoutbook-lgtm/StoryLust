import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Sparkles, Trophy, Star, Crown, Share2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface EndingCardRevealProps {
  isVisible: boolean;
  card: {
    id: string;
    cardTitle: string;
    cardSubtitle?: string;
    cardDescription: string;
    cardImageUrl?: string;
    rarity: "whisper" | "ember" | "flame" | "inferno";
    emotionTag?: string;
    unlockCondition?: string;
    storyTitle?: string;
    isDuplicate?: boolean;
  };
  onContinue: () => void;
  onViewCollection?: () => void;
}

const rarityConfig = {
  whisper: {
    bg: "bg-gradient-to-br from-slate-600 to-slate-800",
    border: "border-slate-500",
    icon: Star,
    glow: "shadow-slate-500/30",
    text: "text-slate-200",
    name: "Whisper"
  },
  ember: {
    bg: "bg-gradient-to-br from-orange-600 to-red-700", 
    border: "border-orange-400",
    icon: Sparkles,
    glow: "shadow-orange-500/40",
    text: "text-orange-200",
    name: "Ember"
  },
  flame: {
    bg: "bg-gradient-to-br from-pink-600 to-purple-800",
    border: "border-pink-400", 
    icon: Trophy,
    glow: "shadow-pink-500/50",
    text: "text-pink-200",
    name: "Flame"
  },
  inferno: {
    bg: "bg-gradient-to-br from-yellow-500 to-red-600",
    border: "border-yellow-400",
    icon: Crown,
    glow: "shadow-yellow-500/60",
    text: "text-yellow-100",
    name: "Inferno"
  }
};

export function EndingCardReveal({ isVisible, card, onContinue, onViewCollection }: EndingCardRevealProps) {
  const [showCard, setShowCard] = useState(false);
  const { toast } = useToast();
  const config = rarityConfig[card.rarity];
  const Icon = config.icon;

  useEffect(() => {
    if (isVisible) {
      // Small delay before showing the card for dramatic effect
      const timer = setTimeout(() => setShowCard(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowCard(false);
    }
  }, [isVisible]);

  useEffect(() => {
    // Haptic feedback when card appears
    if (showCard && navigator.vibrate) {
      navigator.vibrate([100, 50, 100]);
    }
  }, [showCard]);

  const handleContinue = () => {
    onContinue();
  };

  const handleShare = async () => {
    const shareText = `I just unlocked "${card.cardTitle}" - a ${rarityConfig[card.rarity].name} rarity card in Wild Branch! 🍆✨`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Wild Branch Card: ${card.cardTitle}`,
          text: shareText,
          url: window.location.origin
        });
      } else {
        await navigator.clipboard.writeText(`${shareText}\n\n${window.location.origin}`);
        toast({
          title: "Copied to clipboard!",
          description: "Share your card with friends",
        });
      }
    } catch (error) {
      // Fallback to copying
      try {
        await navigator.clipboard.writeText(`${shareText}\n\n${window.location.origin}`);
        toast({
          title: "Copied to clipboard!",
          description: "Share your card with friends",
        });
      } catch (clipboardError) {
        toast({
          title: "Unable to share",
          description: "Try manually copying the card details",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm"
        >
          {/* Card slides up from bottom */}
          <motion.div
            initial={{ y: "100%", scale: 0.9 }}
            animate={{ y: showCard ? 0 : "100%", scale: showCard ? 1 : 0.9 }}
            exit={{ y: "100%", scale: 0.9 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300,
              duration: 0.6
            }}
            className="w-full max-w-sm mx-4 mb-8"
          >
            {/* Card Container */}
            <div className={`
              relative rounded-2xl p-6 border-2 ${config.bg} ${config.border} ${config.glow}
              shadow-2xl overflow-hidden
            `}>
              {/* Rarity Sparkles Background */}
              <motion.div
                animate={{ 
                  opacity: [0.3, 0.7, 0.3],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 3,
                  ease: "easeInOut"
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              />

              {/* Card Content */}
              <div className="relative z-10 text-center space-y-4">
                {/* Rarity Badge */}
                <div className="flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                    className={`
                      flex items-center gap-2 px-3 py-1 rounded-full 
                      bg-white/20 backdrop-blur-sm border ${config.border}/50
                    `}
                  >
                    <Icon size={16} className={config.text} />
                    <span className={`text-sm font-semibold uppercase tracking-wider ${config.text}`}>
                      {config.name}
                    </span>
                  </motion.div>
                </div>

                {/* Card Image Placeholder */}
                {card.cardImageUrl ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="w-20 h-20 mx-auto rounded-full overflow-hidden bg-white/10 backdrop-blur-sm"
                  >
                    <img 
                      src={card.cardImageUrl} 
                      alt={card.cardTitle}
                      className="w-full h-full object-cover"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4 }}
                    className="w-20 h-20 mx-auto rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center"
                  >
                    <Icon size={32} className={config.text} />
                  </motion.div>
                )}

                {/* Card Title */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <h3 className="text-xl font-bold text-white mb-1">
                    {card.cardTitle}
                  </h3>
                  {card.cardSubtitle && (
                    <p className={`text-sm ${config.text} opacity-90`}>
                      {card.cardSubtitle}
                    </p>
                  )}
                </motion.div>

                {/* Card Description */}
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-sm text-white/80 leading-relaxed"
                >
                  {card.cardDescription}
                </motion.p>

                {/* Emotion Tag */}
                {card.emotionTag && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.7 }}
                    className="flex justify-center"
                  >
                    <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/70 border border-white/20">
                      {card.emotionTag}
                    </span>
                  </motion.div>
                )}

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="space-y-3 pt-4"
                >
                  <div className="space-y-2">
                    <Button
                      onClick={handleContinue}
                      className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold border border-white/30 backdrop-blur-sm"
                    >
                      Continue Story
                    </Button>
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={handleShare}
                        variant="outline"
                        className="flex-1 bg-transparent hover:bg-white/10 text-white/80 border-white/30 font-medium"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share Card
                      </Button>
                      
                      {onViewCollection && (
                        <Button
                          onClick={onViewCollection}
                          variant="outline"
                          className="flex-1 bg-transparent hover:bg-white/10 text-white/80 border-white/30 font-medium"
                        >
                          View Collection
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Badge (NEW!/DUPLICATE) */}
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring" }}
                className={`absolute -top-2 -right-2 px-2 py-1 rounded-full text-xs font-bold shadow-lg ${
                  card.isDuplicate 
                    ? "bg-blue-500 text-white" 
                    : "bg-red-500 text-white"
                }`}
              >
                {card.isDuplicate ? "SHARE!" : "NEW!"}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}