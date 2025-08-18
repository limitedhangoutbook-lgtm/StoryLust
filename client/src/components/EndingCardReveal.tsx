import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { Sparkles, Trophy, Star, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EndingCardRevealProps {
  isVisible: boolean;
  card: {
    id: string;
    cardTitle: string;
    cardSubtitle?: string;
    cardDescription: string;
    cardImageUrl?: string;
    rarity: "common" | "rare" | "epic" | "legendary";
    emotionTag?: string;
    unlockCondition?: string;
    storyTitle?: string;
  };
  onContinue: () => void;
  onViewCollection?: () => void;
}

const rarityConfig = {
  common: {
    bg: "bg-gradient-to-br from-gray-600 to-gray-800",
    border: "border-gray-500",
    icon: Star,
    glow: "shadow-gray-500/30",
    text: "text-gray-200"
  },
  rare: {
    bg: "bg-gradient-to-br from-blue-600 to-blue-800", 
    border: "border-blue-400",
    icon: Sparkles,
    glow: "shadow-blue-500/40",
    text: "text-blue-200"
  },
  epic: {
    bg: "bg-gradient-to-br from-purple-600 to-purple-800",
    border: "border-purple-400", 
    icon: Trophy,
    glow: "shadow-purple-500/50",
    text: "text-purple-200"
  },
  legendary: {
    bg: "bg-gradient-to-br from-yellow-500 to-orange-600",
    border: "border-yellow-400",
    icon: Crown,
    glow: "shadow-yellow-500/60",
    text: "text-yellow-100"
  }
};

export function EndingCardReveal({ isVisible, card, onContinue, onViewCollection }: EndingCardRevealProps) {
  const [showCard, setShowCard] = useState(false);
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
                      {card.rarity}
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
                  <Button
                    onClick={onContinue}
                    className="w-full bg-white/20 hover:bg-white/30 text-white font-semibold border border-white/30 backdrop-blur-sm"
                  >
                    Continue Story
                  </Button>
                  
                  {onViewCollection && (
                    <Button
                      onClick={onViewCollection}
                      variant="outline"
                      className="w-full bg-transparent hover:bg-white/10 text-white/80 border-white/30 font-medium"
                    >
                      View Collection
                    </Button>
                  )}
                </motion.div>
              </div>

              {/* "NEW!" Badge */}
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="absolute -top-2 -right-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg"
              >
                NEW!
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}