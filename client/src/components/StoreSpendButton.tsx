import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface StoreSpendButtonProps {
  cost: number;
  onConfirm: () => void;
  disabled?: boolean;
  label: string;
  packageName: string;
  currentBalance?: number;
  className?: string;
}

export function StoreSpendButton({ 
  cost, 
  onConfirm, 
  disabled, 
  label, 
  packageName,
  currentBalance = 0,
  className = "" 
}: StoreSpendButtonProps) {
  const [pressing, setPressing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [dontAskAgain, setDontAskAgain] = useState(false);
  const tRef = useRef<number | null>(null);
  const { toast } = useToast();

  const handlePointerDown = () => {
    if (disabled) return;
    setPressing(true);
    tRef.current = window.setTimeout(() => {
      setPressing(false);
      
      // Check if user has "don't ask again" preference for store purchases
      const skipConfirm = localStorage.getItem('skip-store-confirm') === 'true';
      
      if (skipConfirm) {
        onConfirm();
        // Micro-vibration after confirmation
        if (navigator.vibrate) navigator.vibrate(12);
      } else {
        setShowConfirm(true);
      }
    }, 1000); // Slightly longer hold time for store purchases (1s)
  };

  const handlePointerEnd = () => {
    setPressing(false);
    if (tRef.current) {
      clearTimeout(tRef.current);
      tRef.current = null;
    }
  };

  const handleConfirmPurchase = () => {
    // Save preference if checkbox is checked
    if (dontAskAgain) {
      localStorage.setItem('skip-store-confirm', 'true');
    }
    
    setShowConfirm(false);
    onConfirm();
    
    // Micro-vibration after confirmation
    if (navigator.vibrate) navigator.vibrate(12);
  };

  const canAfford = currentBalance >= cost;
  const resultingBalance = currentBalance - cost;

  return (
    <>
      <button
        className={`relative rounded-xl px-6 py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all font-semibold ${className}`}
        disabled={disabled || !canAfford}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerEnd}
        onPointerLeave={handlePointerEnd}
        onTouchStart={handlePointerDown}
        onTouchEnd={handlePointerEnd}
      >
        <span className="flex items-center justify-center gap-2">
          {label} · ${cost}
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
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                You're about to purchase:
              </p>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 mb-4">
                <div className="font-semibold text-purple-900 dark:text-purple-100">
                  {packageName}
                </div>
                <div className="text-sm text-purple-700 dark:text-purple-300">
                  {label}
                </div>
              </div>
            </div>
            
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Cost:</span>
                <span className="font-semibold text-gray-900 dark:text-white">${cost}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Your balance:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{currentBalance} 🍆</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-600 dark:text-gray-400">After purchase:</span>
                <span className={`font-bold ${resultingBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  +{packageName.includes('50') ? '50' : packageName.includes('100') ? '100' : packageName.includes('250') ? '250' : '500'} 🍆
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
                Don't ask again for store purchases
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
                className="flex-1 bg-purple-600 hover:bg-purple-700"
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