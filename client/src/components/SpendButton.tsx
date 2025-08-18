import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface SpendButtonProps {
  cost: number;
  onConfirm: () => void;
  disabled?: boolean;
  label: string;
  currentBalance?: number;
  className?: string;
}

export function SpendButton({ 
  cost, 
  onConfirm, 
  disabled, 
  label, 
  currentBalance = 0,
  className = "" 
}: SpendButtonProps) {
  const [pressing, setPressing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const tRef = useRef<number | null>(null);
  const { toast } = useToast();

  const handlePointerDown = () => {
    if (disabled) return;
    console.log('SpendButton: handlePointerDown - starting hold timer');
    setPressing(true);
    tRef.current = window.setTimeout(() => {
      console.log('SpendButton: hold timer complete');
      setPressing(false);
      
      // Check if user has "don't ask again" preference for this story
      const storyId = window.location.pathname.split('/').pop() || '';
      const skipConfirm = localStorage.getItem(`skip-confirm-${storyId}`) === 'true';
      
      console.log('SpendButton: skipConfirm =', skipConfirm);
      
      if (skipConfirm) {
        console.log('SpendButton: calling onConfirm directly');
        onConfirm();
        // Micro-vibration after confirmation
        if (navigator.vibrate) navigator.vibrate(12);
      } else {
        console.log('SpendButton: showing confirmation modal');
        setShowConfirm(true);
      }
    }, 900); // 900ms hold time
  };

  const handlePointerEnd = () => {
    setPressing(false);
    if (tRef.current) {
      clearTimeout(tRef.current);
      tRef.current = null;
    }
  };

  const handleConfirmPurchase = () => {
    const storyId = window.location.pathname.split('/').pop() || '';
    
    // Save preference if checkbox is checked
    if (dontAskAgain) {
      localStorage.setItem(`skip-confirm-${storyId}`, 'true');
    }
    
    setShowConfirm(false);
    onConfirm();
    
    // Micro-vibration after confirmation
    if (navigator.vibrate) navigator.vibrate(12);
  };

  const resultingBalance = currentBalance - cost;
  const canAfford = currentBalance >= cost;

  return (
    <>
      <button
        className={`relative rounded-xl px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${className}`}
        disabled={disabled || !canAfford}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        onTouchStart={handlePointerDown}
        onTouchEnd={handlePointerEnd}
        onClick={(e) => {
          // Fallback for devices that don't support pointer events well
          e.preventDefault();
          console.log('SpendButton clicked - cost:', cost, 'balance:', currentBalance, 'disabled:', disabled || !canAfford);
        }}
      >
        <span className="flex items-center justify-center gap-2">
          {label} · {cost} 🍆
        </span>
        {pressing && (
          <span className="absolute inset-0 rounded-xl ring-2 ring-purple-300 animate-pulse bg-purple-500/20" />
        )}
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">
              Confirm Purchase
            </h3>
            
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Cost:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{cost} 🍆</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Your balance:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{currentBalance} 🍆</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600 dark:text-gray-400">After purchase:</span>
                <span className={`font-bold ${resultingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {resultingBalance} 🍆
                </span>
              </div>
            </div>

            <label className="flex items-center gap-2 mb-4 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={dontAskAgain}
                onChange={(e) => setDontAskAgain(e.target.checked)}
                className="rounded"
              />
              <span className="text-gray-700 dark:text-gray-300">
                Don't ask again for this story
              </span>
            </label>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmPurchase}
                disabled={!canAfford}
                className="flex-1 bg-eggplant-600 hover:bg-eggplant-700"
              >
                Confirm Purchase
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}