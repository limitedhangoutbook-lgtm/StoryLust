import { Button } from "@/components/ui/button";

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
  const canAfford = currentBalance >= cost;
  
  const handleClick = () => {
    console.log('SimpleSpendButton clicked:', { cost, currentBalance, disabled, canAfford });
    if (disabled || !canAfford) {
      console.log('SimpleSpendButton: disabled or cannot afford, not proceeding');
      return;
    }
    
    // Simple direct confirmation for testing
    const confirmed = window.confirm(`Spend ${cost} 🍆 for this premium choice?\n\nYour balance: ${currentBalance} 🍆\nAfter purchase: ${currentBalance - cost} 🍆`);
    
    if (confirmed) {
      console.log('SimpleSpendButton: user confirmed, calling onConfirm');
      onConfirm();
    } else {
      console.log('SimpleSpendButton: user cancelled');
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || !canAfford}
      className={`w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold ${className}`}
    >
      {label} · {cost} 🍆
      {!canAfford && ` (Need ${cost - currentBalance} more 🍆)`}
    </Button>
  );
}