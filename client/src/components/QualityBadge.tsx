interface QualityBadgeProps {
  variant?: "standard" | "enhanced" | "seal";
  className?: string;
}

export function QualityBadge({ variant = "standard", className = "" }: QualityBadgeProps) {
  if (variant === "seal") {
    return (
      <div className={`relative ${className}`}>
        <div className="w-16 h-16 bg-gradient-to-br from-purple-900 to-rose-gold rounded-full border-2 border-purple-600/30 shadow-lg flex flex-col items-center justify-center">
          <span className="text-[8px] font-bold tracking-wider text-white uppercase text-center leading-tight">
            100% Human
            <br />
            Written
          </span>
          <span className="text-xs opacity-90 mt-0.5">✍️</span>
        </div>
        {/* Subtle rotating shimmer */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 animate-spin" style={{ animationDuration: '12s' }} />
      </div>
    );
  }

  if (variant === "enhanced") {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <div className="px-4 py-2 bg-gradient-to-r from-purple-900 via-purple-700 to-rose-gold rounded-full border border-purple-600/30 shadow-xl">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider text-white uppercase">
              100% Human Written Erotica
            </span>
            <span className="text-sm opacity-90">✍️</span>
          </div>
        </div>
        {/* Gentle glow effect */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-rose-gold/20 via-purple-500/20 to-rose-gold/20 animate-pulse" />
      </div>
    );
  }

  // Standard variant
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="px-3 py-1.5 bg-gradient-to-r from-purple-900 via-purple-700 to-rose-gold rounded-full border border-purple-600/30 shadow-lg quality-badge-shimmer">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold tracking-wider text-white uppercase">
            100% Human Written Erotica
          </span>
          <span className="text-xs opacity-90">✍️</span>
        </div>
      </div>
    </div>
  );
}