import { Plus } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { isAdmin } from "@shared/userRoles";
import { cn } from "@/lib/utils";

interface FloatingCreateButtonProps {
  className?: string;
}

export function FloatingCreateButton({ className }: FloatingCreateButtonProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Only show for admin users
  if (!user || !isAdmin(user)) {
    return null;
  }

  return (
    <button
      onClick={() => setLocation("/story-builder")}
      className={cn(
        "fixed bottom-24 right-4 z-40",
        "w-14 h-14 bg-rose-gold hover:bg-rose-gold/90",
        "rounded-full shadow-lg hover:shadow-xl",
        "flex items-center justify-center",
        "transition-all duration-200 transform hover:scale-105",
        "border-2 border-rose-gold/20",
        className
      )}
      title="Create New Story"
    >
      <Plus className="w-6 h-6 text-dark-primary" strokeWidth={2.5} />
    </button>
  );
}

export default FloatingCreateButton;