interface QualityBadgeProps {
  variant?: "standard" | "enhanced" | "seal";
  className?: string;
}

export function QualityBadge({ variant = "standard", className = "" }: QualityBadgeProps) {
  if (variant === "seal") {
    return (
      <div className={`relative ${className}`}>
        <div className="w-16 h-16 bg-gradient-to-br from-purple-900 to-rose-gold rounded-full border-2 border-purple-600/30 shadow-lg flex flex-col items-center justify-center">
          <span className="text-[7px] font-black tracking-wider text-white uppercase text-center leading-tight" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontStretch: 'condensed' }}>
            100% HUMAN
            <br />
            WRITTEN
          </span>
          <span className="text-xs opacity-90 mt-0.5">✍️</span>
        </div>
      </div>
    );
  }

  if (variant === "enhanced") {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <div className="px-5 py-2.5 bg-gradient-to-r from-purple-900 via-purple-800 to-rose-gold rounded-full border border-purple-600/30 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black tracking-widest text-white uppercase" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontStretch: 'condensed' }}>
              100% HUMAN
            </span>
            <span className="text-xs font-light tracking-wide text-white/90 uppercase">
              WRITTEN EROTICA
            </span>
            <span className="text-sm opacity-90 ml-1">✍️</span>
          </div>
        </div>
      </div>
    );
  }

  // Standard variant
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="px-3 py-1.5 bg-gradient-to-r from-purple-900 via-purple-800 to-rose-gold rounded-full border border-purple-600/30 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black tracking-widest text-white uppercase" style={{ fontFamily: 'Inter, system-ui, sans-serif', fontStretch: 'condensed' }}>
            100% HUMAN
          </span>
          <span className="text-[10px] font-light tracking-wide text-white/90 uppercase">
            WRITTEN EROTICA
          </span>
          <span className="text-xs opacity-90 ml-1">✍️</span>
        </div>
      </div>
    </div>
  );
}