import { motion } from "framer-motion";
import { useEffect, useState } from "react";

interface PremiumUnlockAnimationProps {
  children: React.ReactNode;
  isUnlocked: boolean;
  onAnimationComplete?: () => void;
}

export function PremiumUnlockAnimation({ 
  children, 
  isUnlocked, 
  onAnimationComplete 
}: PremiumUnlockAnimationProps) {
  const [hasPlayed, setHasPlayed] = useState(false);

  useEffect(() => {
    if (isUnlocked && !hasPlayed) {
      setHasPlayed(true);
      
      // Optional audio chime
      try {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmEhCSl+0O/CdSQGJ2+68uCUR2YQD1y+8OKdVhIDe+rBP1y+8OKdVhIDe+q');
        audio.volume = 0.1;
        audio.play().catch(() => {}); // Ignore if audio fails
      } catch (error) {
        // Audio not supported or blocked
      }
      
      onAnimationComplete?.();
    }
  }, [isUnlocked, hasPlayed, onAnimationComplete]);

  if (!isUnlocked) {
    return <>{children}</>;
  }

  return (
    <motion.div
      initial={hasPlayed ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        ease: "easeOut",
        opacity: { duration: 0.4 },
        scale: { duration: 0.3 }
      }}
      className="relative"
    >
      {/* Glow effect */}
      {!hasPlayed && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.8, 0] }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-400/20 to-pink-400/20 blur-sm pointer-events-none"
          style={{ margin: '-4px' }}
        />
      )}
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}