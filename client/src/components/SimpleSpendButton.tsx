import { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

interface SimpleSpendButtonProps {
  cost: number;
  onConfirm: () => void;
  disabled?: boolean;
  label: string;
  currentBalance?: number;
  className?: string;
}

export function SimpleSpendButton({ 
  cost, 
  onConfirm, 
  disabled, 
  label, 
  currentBalance = 0,
  className = "" 
}: SimpleSpendButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const canAfford = currentBalance >= cost;
  
  const handleClick = () => {
    if (disabled || !canAfford) return;
    
    // Haptic feedback on tap
    if (navigator.vibrate) navigator.vibrate(8);
    
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    onConfirm();
    // Success vibration feedback
    if (navigator.vibrate) navigator.vibrate([15, 50, 15]);
  };

  const resultingBalance = currentBalance - cost;

  return (
    <>
      <motion.div
        whileTap={canAfford ? { scale: 1.05 } : { scale: 0.98 }}
        transition={{ duration: 0.1, ease: "easeOut" }}
        className="w-full"
      >
        <Button
          onClick={handleClick}
          disabled={disabled}
          className={`
            w-full font-semibold shadow-lg transition-all duration-200
            ${canAfford 
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-purple-500/25' 
              : 'bg-gradient-to-r from-gray-500 to-gray-600 text-gray-200 opacity-70 shadow-gray-500/10'
            }
            ${className}
          `}
        >
          <span className="flex items-center justify-center gap-2">
            {!canAfford && <Lock size={16} />}
            {canAfford ? (
              <span>{label} ({cost} 🍆)</span>
            ) : (
              <span>The moment slips away... (Need {cost} 🍆)</span>
            )}
          </span>
        </Button>
      </motion.div>

      {/* Soft Premium Choice Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-6 backdrop-blur-sm">
          <div className="bg-kindle/95 backdrop-blur-sm rounded-2xl p-6 max-w-sm w-full mx-4 border border-rose-gold/20 shadow-2xl">
            
            {/* Header */}
            <div className="text-center mb-6">
              <div className="text-3xl mb-2">🍆✨</div>
              <h3 className="text-lg font-bold text-kindle mb-1">Premium Choice</h3>
              <p className="text-sm text-kindle-secondary">Unlock this exclusive story path</p>
            </div>
            
            {/* Cost Breakdown */}
            <div className="bg-dark-secondary/50 rounded-xl p-4 mb-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-kindle-secondary">Cost:</span>
                <span className="font-semibold text-kindle">{cost} 🍆</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-kindle-secondary">Your balance:</span>
                <span className="font-semibold text-kindle">{currentBalance} 🍆</span>
              </div>
              <div className="border-t border-dark-tertiary/30 pt-3">
                <div className="flex justify-between">
                  <span className="text-kindle-secondary">After purchase:</span>
                  <span className="font-bold text-rose-gold">{resultingBalance} 🍆</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                className="flex-1 border-dark-tertiary hover:bg-dark-tertiary/20 text-kindle-secondary"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-semibold"
              >
                Unlock Path
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}